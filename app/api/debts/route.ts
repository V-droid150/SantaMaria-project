import { NextResponse } from "next/server";
import { Prisma, DebtType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";
import { computeStatus } from "@/lib/debt";

// Hutang (PAYABLE: kita berhutang ke supplier) & Piutang (RECEIVABLE: pelanggan berhutang ke kita).

type Body = {
  type?: "RECEIVABLE" | "PAYABLE";
  amount?: number;
  partyName?: string; // nama pelanggan (piutang) / supplier (hutang)
  dueDate?: string | null;
  note?: string;
  paidAmount?: number; // bila sebagian sudah dibayar saat dicatat
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!canAccess(session.role, "/debts")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const type = body.type === "PAYABLE" ? DebtType.PAYABLE : DebtType.RECEIVABLE;
  const amount = Number(body.amount);
  const partyName = body.partyName?.trim();
  const paid = Math.max(0, Number(body.paidAmount) || 0);

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Jumlah harus lebih dari 0" }, { status: 400 });
  }
  if (!partyName) {
    return NextResponse.json(
      { error: type === DebtType.PAYABLE ? "Nama supplier wajib diisi" : "Nama pelanggan wajib diisi" },
      { status: 400 }
    );
  }
  if (paid > amount) {
    return NextResponse.json({ error: "Jumlah dibayar melebihi total" }, { status: 400 });
  }

  // Temukan/buat pihak terkait (customer utk piutang, supplier utk hutang).
  let customerId: string | null = null;
  let supplierId: string | null = null;
  if (type === DebtType.RECEIVABLE) {
    const found = await prisma.customer.findFirst({
      where: { storeId: session.storeId, name: { equals: partyName, mode: "insensitive" } },
      select: { id: true },
    });
    customerId =
      found?.id ??
      (await prisma.customer.create({ data: { name: partyName, storeId: session.storeId }, select: { id: true } })).id;
  } else {
    const found = await prisma.supplier.findFirst({
      where: { storeId: session.storeId, name: { equals: partyName, mode: "insensitive" } },
      select: { id: true },
    });
    supplierId =
      found?.id ??
      (await prisma.supplier.create({ data: { name: partyName, storeId: session.storeId }, select: { id: true } })).id;
  }

  const debt = await prisma.debt.create({
    data: {
      type,
      status: computeStatus(amount, paid),
      amount: new Prisma.Decimal(amount),
      paidAmount: new Prisma.Decimal(paid),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      note: body.note?.trim() || null,
      storeId: session.storeId,
      customerId,
      supplierId,
    },
  });

  return NextResponse.json({ debt: { id: debt.id } }, { status: 201 });
}
