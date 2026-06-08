import { NextResponse } from "next/server";
import { Prisma, CashFlowType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

type Body = {
  type?: CashFlowType;
  amount?: number;
  category?: string;
  description?: string;
  occurredAt?: string;
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!canAccess(session.role, "/finance")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const type = body.type === "EXPENSE" ? CashFlowType.EXPENSE : CashFlowType.INCOME;
  const amount = Number(body.amount);
  const category = body.category?.trim();

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Jumlah harus lebih dari 0" }, { status: 400 });
  }
  if (!category) {
    return NextResponse.json({ error: "Kategori wajib diisi" }, { status: 400 });
  }

  const cashFlow = await prisma.cashFlow.create({
    data: {
      type,
      amount: new Prisma.Decimal(amount),
      category,
      description: body.description?.trim() || null,
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
      storeId: session.storeId,
      userId: session.userId,
    },
  });

  return NextResponse.json({ cashFlow }, { status: 201 });
}
