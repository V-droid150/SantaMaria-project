import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { Prisma, OrderStatus, PaymentStatus, PaymentMethod, ProductType, SalesChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isMidtransConfigured, createSnapToken, midtransClientKey, snapJsUrl } from "@/lib/midtrans";
import { notifyStore } from "@/lib/push";
import { rupiah } from "@/lib/format";

export const runtime = "nodejs";

// Token rahasia untuk halaman akses pesanan publik /order/[token]
// (pembeli memantau status & mengambil produk digital setelah lunas).
function generateAccessToken(): string {
  return randomBytes(24).toString("base64url");
}

// Order publik dari halaman katalog toko (tanpa login).
// Status PENDING/UNPAID — pembayaran online menyusul. Stok belum dikurangi
// (akan dikurangi saat pembayaran dikonfirmasi pada fase berikutnya).

type ItemIn = { variantId: string; quantity: number };
type Body = {
  slug?: string;
  items?: ItemIn[];
  customer?: { name?: string; phone?: string; address?: string };
  note?: string;
  payMethod?: "auto" | "manual";
  proof?: string | null;
};

function sanitizeProof(p?: string | null): string | null {
  if (!p) return null;
  if (p.length > 2_800_000) return null; // bukti terlalu besar -> abaikan
  if (!/^data:image\/|^https?:\/\//.test(p)) return null;
  return p;
}

function generateOrderNumber(): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  return `ONL-${date}-${String(now.getTime()).slice(-6)}`;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const slug = body.slug?.trim();
  if (!slug) return NextResponse.json({ error: "Toko tidak diketahui" }, { status: 400 });

  const items = (body.items ?? []).filter((i) => i.variantId && i.quantity > 0);
  if (items.length === 0) {
    return NextResponse.json({ error: "Keranjang kosong" }, { status: 400 });
  }

  const custName = body.customer?.name?.trim();
  if (!custName) return NextResponse.json({ error: "Nama pemesan wajib diisi" }, { status: 400 });
  const custPhone = body.customer?.phone?.trim() || null;

  const store = await prisma.store.findUnique({
    where: { slug },
    select: { id: true, taxRate: true },
  });
  if (!store) return NextResponse.json({ error: "Toko tidak ditemukan" }, { status: 404 });

  const payMethod = body.payMethod === "manual" ? "manual" : "auto";
  const proof = payMethod === "manual" ? sanitizeProof(body.proof) : null;

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Harga & stok diambil dari server (anti-manipulasi).
      const variants = await tx.productVariant.findMany({
        where: { id: { in: items.map((i) => i.variantId) }, product: { storeId: store.id } },
        include: { product: { select: { type: true } } },
      });
      const vmap = new Map(variants.map((v) => [v.id, v]));

      let subtotal = 0;
      const orderItems: Prisma.OrderItemCreateManyOrderInput[] = [];
      for (const it of items) {
        const v = vmap.get(it.variantId);
        if (!v) throw new Error("Produk tidak ditemukan");
        if (v.product.type === ProductType.PHYSICAL && v.stock < it.quantity) {
          throw new Error(`Stok "${v.name}" tidak cukup (sisa ${v.stock})`);
        }
        const price = Number(v.price);
        const line = price * it.quantity;
        subtotal += line;
        orderItems.push({
          variantId: v.id,
          quantity: it.quantity,
          unitPrice: v.price,
          costPrice: v.costPrice,
          subtotal: new Prisma.Decimal(line),
        });
      }

      const taxRate = Number(store.taxRate);
      const taxTotal = (subtotal * taxRate) / 100;
      const grandTotal = subtotal + taxTotal;

      // Pesanan diatasnamakan pemilik toko (Order.userId wajib).
      const owner = await tx.user.findFirst({
        where: { storeId: store.id },
        orderBy: { role: "asc" }, // ADMIN dulu (urut enum)
        select: { id: true },
      });
      if (!owner) throw new Error("Toko belum memiliki pemilik");

      // Catat/temukan pelanggan agar muncul di CRM penjual.
      let customerId: string | null = null;
      if (custPhone) {
        const found = await tx.customer.findFirst({
          where: { storeId: store.id, phone: custPhone },
          select: { id: true },
        });
        customerId =
          found?.id ??
          (
            await tx.customer.create({
              data: {
                name: custName,
                phone: custPhone,
                address: body.customer?.address?.trim() || null,
                storeId: store.id,
              },
              select: { id: true },
            })
          ).id;
      } else {
        customerId = (
          await tx.customer.create({
            data: { name: custName, storeId: store.id, address: body.customer?.address?.trim() || null },
            select: { id: true },
          })
        ).id;
      }

      return tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          accessToken: generateAccessToken(),
          status: OrderStatus.PENDING,
          channel: SalesChannel.ONLINE_STORE,
          subtotal: new Prisma.Decimal(subtotal),
          taxTotal: new Prisma.Decimal(taxTotal),
          grandTotal: new Prisma.Decimal(grandTotal),
          paymentMethod: payMethod === "manual" ? PaymentMethod.BANK_TRANSFER : PaymentMethod.CASH,
          paymentStatus: PaymentStatus.UNPAID,
          paymentProofUrl: payMethod === "manual" ? proof : null,
          note: body.note?.trim() || null,
          storeId: store.id,
          userId: owner.id,
          customerId,
          items: { createMany: { data: orderItems } },
        },
        select: { orderNumber: true, grandTotal: true, accessToken: true },
      });
    });

    const total = Number(order.grandTotal);
    const token = order.accessToken;

    // Notifikasi ke semua staf toko (best-effort, tak menggagalkan checkout).
    const isManual = payMethod === "manual";
    await notifyStore(store.id, {
      title: isManual ? "Transfer manual perlu konfirmasi 💸" : "Pesanan online baru 🛍️",
      body: `${order.orderNumber} • ${rupiah(total)} dari ${custName}${
        isManual ? " — cek bukti transfer & konfirmasi" : ""
      }`,
      url: "/orders",
      tag: `order-${order.orderNumber}`,
    });

    // Pembayaran otomatis (Snap) hanya jika dipilih & Midtrans aktif.
    if (payMethod === "auto" && isMidtransConfigured()) {
      try {
        const snapToken = await createSnapToken({
          orderId: order.orderNumber,
          grossAmount: total,
          customerName: custName,
          customerPhone: custPhone,
        });
        return NextResponse.json(
          {
            orderNumber: order.orderNumber,
            total,
            token,
            snapToken,
            clientKey: midtransClientKey(),
            snapUrl: snapJsUrl(),
          },
          { status: 201 }
        );
      } catch {
        // Pembayaran gagal disiapkan -> order tetap ada (PENDING), tampilkan sukses biasa.
        return NextResponse.json({ orderNumber: order.orderNumber, total, token }, { status: 201 });
      }
    }

    return NextResponse.json({ orderNumber: order.orderNumber, total, token }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal membuat pesanan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
