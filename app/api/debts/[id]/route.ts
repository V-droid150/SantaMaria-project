import { NextResponse } from "next/server";
import { Prisma, DebtType, CashFlowType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";
import { computeStatus } from "@/lib/debt";

// Catat pembayaran cicilan hutang/piutang + rekam arus kas; atau hapus.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!canAccess(session.role, "/debts")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  let body: { amount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const debt = await prisma.debt.findFirst({
    where: { id: params.id, storeId: session.storeId },
    include: { customer: { select: { name: true } }, supplier: { select: { name: true } } },
  });
  if (!debt) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

  const pay = Number(body.amount);
  if (!pay || pay <= 0) return NextResponse.json({ error: "Jumlah bayar harus lebih dari 0" }, { status: 400 });

  const total = Number(debt.amount);
  const already = Number(debt.paidAmount);
  const remaining = total - already;
  if (pay > remaining + 0.5) {
    return NextResponse.json({ error: "Jumlah melebihi sisa tagihan" }, { status: 400 });
  }
  const newPaid = Math.min(total, already + pay);

  await prisma.$transaction(async (tx) => {
    await tx.debt.update({
      where: { id: debt.id },
      data: { paidAmount: new Prisma.Decimal(newPaid), status: computeStatus(total, newPaid) },
    });

    // Pembayaran = pergerakan kas nyata.
    const isReceivable = debt.type === DebtType.RECEIVABLE;
    const partyName = isReceivable ? debt.customer?.name : debt.supplier?.name;
    await tx.cashFlow.create({
      data: {
        type: isReceivable ? CashFlowType.INCOME : CashFlowType.EXPENSE,
        amount: new Prisma.Decimal(pay),
        category: isReceivable ? "Pembayaran Piutang" : "Pembayaran Hutang",
        description: partyName ? `${isReceivable ? "Dari" : "Ke"} ${partyName}` : null,
        storeId: session.storeId,
        userId: session.userId,
      },
    });
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!canAccess(session.role, "/debts")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const debt = await prisma.debt.findFirst({ where: { id: params.id, storeId: session.storeId }, select: { id: true } });
  if (!debt) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

  await prisma.debt.delete({ where: { id: debt.id } });
  return NextResponse.json({ ok: true });
}
