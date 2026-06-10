import { NextResponse } from "next/server";
import { OrderStatus, PaymentStatus, PaymentMethod, ProductType, StockMovementType, CashFlowType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isMidtransConfigured,
  verifyNotificationSignature,
  mapPaymentMethod,
  isDisbursementConfigured,
  disburseToSeller,
  platformFeePercent,
} from "@/lib/midtrans";
import { notifyStore, notifyLowStock } from "@/lib/push";
import { rupiah } from "@/lib/format";

export const runtime = "nodejs";

// Webhook Midtrans: dipanggil Midtrans saat status pembayaran berubah.
// Selalu balas 200 untuk kasus yang sudah ditangani agar Midtrans berhenti retry.
export async function POST(req: Request) {
  if (!isMidtransConfigured()) {
    return NextResponse.json({ ok: true });
  }

  let n: {
    order_id?: string;
    status_code?: string;
    gross_amount?: string;
    signature_key?: string;
    transaction_status?: string;
    fraud_status?: string;
    payment_type?: string;
  };
  try {
    n = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  if (!n.order_id || !n.status_code || !n.gross_amount || !n.signature_key) {
    return NextResponse.json({ error: "Notifikasi tidak lengkap" }, { status: 400 });
  }

  // Verifikasi keaslian notifikasi.
  if (
    !verifyNotificationSignature({
      order_id: n.order_id,
      status_code: n.status_code,
      gross_amount: n.gross_amount,
      signature_key: n.signature_key,
    })
  ) {
    return NextResponse.json({ error: "Tanda tangan tidak valid" }, { status: 403 });
  }

  const order = await prisma.order.findFirst({
    where: { orderNumber: n.order_id },
    include: {
      items: { include: { variant: { include: { product: { select: { type: true } } } } } },
      store: { select: { payoutBankCode: true, payoutAccount: true, payoutName: true } },
    },
  });
  if (!order) return NextResponse.json({ ok: true }); // sudah dihapus / tidak ada — stop retry

  const status = n.transaction_status;
  const paid = status === "settlement" || (status === "capture" && n.fraud_status === "accept");
  const failed = status === "deny" || status === "cancel" || status === "expire";

  // Pembayaran sukses & belum diproses -> tandai LUNAS + kurangi stok + catat kas.
  if (paid && order.paymentStatus !== PaymentStatus.PAID) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.PAID,
          paidAmount: order.grandTotal,
          paymentMethod: mapPaymentMethod(n.payment_type) as PaymentMethod,
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
              userId: order.userId,
              note: `Penjualan online ${order.orderNumber}`,
            },
          });
        }
      }

      await tx.cashFlow.create({
        data: {
          type: CashFlowType.INCOME,
          amount: order.grandTotal,
          category: "Penjualan Online",
          description: `Order ${order.orderNumber}`,
          storeId: order.storeId,
          userId: order.userId,
          orderId: order.id,
        },
      });
    });

    // Notifikasi: pembayaran berhasil + cek stok menipis (best-effort).
    await notifyStore(order.storeId, {
      title: "Pembayaran berhasil ✅",
      body: `${order.orderNumber} • ${rupiah(Number(order.grandTotal))} sudah lunas. Pesanan siap diproses.`,
      url: "/orders",
      tag: `paid-${order.orderNumber}`,
    });
    await notifyLowStock(
      order.storeId,
      order.items.map((it) => it.variantId)
    );

    // Model C: salurkan dana otomatis ke rekening penjual (best-effort).
    if (
      isDisbursementConfigured() &&
      order.store.payoutBankCode &&
      order.store.payoutAccount &&
      order.store.payoutName
    ) {
      const net = Number(order.grandTotal) * (1 - platformFeePercent() / 100);
      try {
        await disburseToSeller({
          name: order.store.payoutName,
          account: order.store.payoutAccount,
          bankCode: order.store.payoutBankCode,
          amount: net,
          notes: `Order ${order.orderNumber}`,
        });
      } catch {
        // Jangan gagalkan webhook bila disbursement gagal — bisa diproses ulang manual.
      }
    }
  } else if (failed && order.status !== OrderStatus.PAID) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  return NextResponse.json({ ok: true });
}
