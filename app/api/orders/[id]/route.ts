import { NextResponse } from "next/server";
import { OrderStatus, PaymentStatus, ProductType, StockMovementType, CashFlowType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";
import { notifyLowStock } from "@/lib/push";

// Konfirmasi / tolak pesanan (mis. order online transfer manual).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!canAccess(session.role, "/orders")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  let body: { action?: "confirm" | "cancel" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: params.id, storeId: session.storeId },
    include: { items: { include: { variant: { include: { product: { select: { type: true } } } } } } },
  });
  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });

  if (body.action === "confirm") {
    if (order.paymentStatus === PaymentStatus.PAID) {
      return NextResponse.json({ ok: true }); // sudah lunas
    }
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.PAID,
          paidAmount: order.grandTotal,
        },
      });
      for (const it of order.items) {
        if (it.variant.product.type === ProductType.PHYSICAL) {
          await tx.productVariant.update({
            where: { id: it.variantId },
            data: { stock: { decrement: it.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              type: StockMovementType.SALE,
              quantity: -it.quantity,
              variantId: it.variantId,
              orderId: order.id,
              userId: session.userId,
              note: `Penjualan ${order.orderNumber}`,
            },
          });
        }
      }
      await tx.cashFlow.create({
        data: {
          type: CashFlowType.INCOME,
          amount: order.grandTotal,
          category: order.channel === "ONLINE_STORE" ? "Penjualan Online" : "Penjualan",
          description: `Order ${order.orderNumber}`,
          storeId: order.storeId,
          userId: session.userId,
          orderId: order.id,
        },
      });
    });
    // Cek stok menipis setelah pesanan dikonfirmasi (best-effort).
    await notifyLowStock(
      order.storeId,
      order.items.map((it) => it.variantId)
    );
    return NextResponse.json({ ok: true });
  }

  if (body.action === "cancel") {
    if (order.paymentStatus === PaymentStatus.PAID) {
      return NextResponse.json({ error: "Pesanan sudah lunas, tidak bisa dibatalkan" }, { status: 400 });
    }
    await prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.CANCELLED } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
}
