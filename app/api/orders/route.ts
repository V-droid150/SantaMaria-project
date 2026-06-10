import { NextResponse } from "next/server";
import { Prisma, OrderStatus, PaymentStatus, ProductType, StockMovementType, CashFlowType, SalesChannel, PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notifyLowStock } from "@/lib/push";

type IncomingItem = { variantId: string; quantity: number };
type Body = {
  items: IncomingItem[];
  customerId?: string | null;
  paymentMethod?: PaymentMethod;
  channel?: SalesChannel;
  paidAmount?: number;
};

// Buat nomor struk: INV-YYYYMMDD-<6 digit waktu>
function generateOrderNumber(): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const suffix = String(now.getTime()).slice(-6);
  return `INV-${date}-${suffix}`;
}

export async function POST(req: Request) {
  // 1) Hanya ADMIN & KASIR yang boleh membuat transaksi.
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (session.role === "STAF_GUDANG") {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Keranjang kosong" }, { status: 400 });
  }

  const paymentMethod = body.paymentMethod ?? PaymentMethod.CASH;
  const channel = body.channel ?? SalesChannel.POS;

  try {
    // 2) Semua operasi dalam SATU transaksi agar stok & order konsisten.
    const order = await prisma.$transaction(async (tx) => {
      // Ambil data varian terkini (harga & stok = sumber kebenaran di server,
      // JANGAN percaya harga dari client).
      const variantIds = body.items.map((i) => i.variantId);
      // Scope ke toko milik sesi: cegah IDOR lintas-toko (mengurangi stok /
      // membaca harga varian milik toko lain).
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds }, product: { storeId: session.storeId } },
        include: { product: { select: { type: true } } },
      });
      const variantMap = new Map(variants.map((v) => [v.id, v]));

      const store = await tx.store.findUnique({
        where: { id: session.storeId },
        select: { taxRate: true },
      });
      const taxRate = store ? Number(store.taxRate) : 0;

      let subtotal = 0;
      const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];
      const stockOps: { variantId: string; qty: number }[] = [];

      for (const item of body.items) {
        const v = variantMap.get(item.variantId);
        if (!v) throw new Error(`Varian ${item.variantId} tidak ditemukan`);
        if (item.quantity <= 0) throw new Error("Kuantitas harus > 0");

        // Cek stok hanya untuk produk fisik.
        const isPhysical = v.product.type === ProductType.PHYSICAL;
        if (isPhysical && v.stock < item.quantity) {
          throw new Error(`Stok "${v.name}" tidak cukup (sisa ${v.stock})`);
        }

        const price = Number(v.price);
        const lineSubtotal = price * item.quantity;
        subtotal += lineSubtotal;

        orderItemsData.push({
          variantId: v.id,
          quantity: item.quantity,
          unitPrice: v.price,
          costPrice: v.costPrice,
          subtotal: new Prisma.Decimal(lineSubtotal),
        });

        if (isPhysical) stockOps.push({ variantId: v.id, qty: item.quantity });
      }

      const taxTotal = (subtotal * taxRate) / 100;
      const grandTotal = subtotal + taxTotal;
      const paidAmount = body.paidAmount ?? grandTotal;
      const paymentStatus =
        paidAmount >= grandTotal
          ? PaymentStatus.PAID
          : paidAmount > 0
            ? PaymentStatus.PARTIAL
            : PaymentStatus.UNPAID;

      // Validasi pelanggan milik toko ini (cegah menautkan pelanggan toko lain).
      let customerId: string | null = null;
      if (body.customerId) {
        const c = await tx.customer.findFirst({
          where: { id: body.customerId, storeId: session.storeId },
          select: { id: true },
        });
        if (!c) throw new Error("Pelanggan tidak ditemukan");
        customerId = c.id;
      }

      // Buat order + item sekaligus.
      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          status: paymentStatus === PaymentStatus.PAID ? OrderStatus.PAID : OrderStatus.PENDING,
          channel,
          subtotal: new Prisma.Decimal(subtotal),
          taxTotal: new Prisma.Decimal(taxTotal),
          grandTotal: new Prisma.Decimal(grandTotal),
          paymentMethod,
          paymentStatus,
          paidAmount: new Prisma.Decimal(paidAmount),
          storeId: session.storeId,
          userId: session.userId,
          customerId,
          items: { createMany: { data: orderItemsData } },
        },
      });

      // 3) Kurangi stok + catat StockMovement (audit trail) untuk tiap item fisik.
      for (const op of stockOps) {
        await tx.productVariant.update({
          where: { id: op.variantId },
          data: { stock: { decrement: op.qty } },
        });
        await tx.stockMovement.create({
          data: {
            type: StockMovementType.SALE,
            quantity: -op.qty, // negatif = stok berkurang
            variantId: op.variantId,
            orderId: created.id,
            userId: session.userId,
            note: `Penjualan ${created.orderNumber}`,
          },
        });
      }

      // 4) Catat pemasukan ke arus kas bila sudah dibayar.
      if (paymentStatus === PaymentStatus.PAID) {
        await tx.cashFlow.create({
          data: {
            type: CashFlowType.INCOME,
            amount: new Prisma.Decimal(grandTotal),
            category: "Penjualan",
            description: `Order ${created.orderNumber}`,
            storeId: session.storeId,
            userId: session.userId,
            orderId: created.id,
          },
        });
      }

      return created;
    });

    // Cek stok menipis setelah penjualan (best-effort).
    await notifyLowStock(
      session.storeId,
      body.items.map((i) => i.variantId)
    );

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal membuat pesanan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
