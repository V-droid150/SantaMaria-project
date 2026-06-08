import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

type Body = {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxRate?: number;
  category?: string;
  businessType?: string;
};

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!canAccess(session.role, "/settings")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "Nama toko wajib diisi" }, { status: 400 });

  const tax = Number(body.taxRate);
  const taxRate = Number.isFinite(tax) && tax >= 0 && tax <= 100 ? tax : 0;

  const store = await prisma.store.update({
    where: { id: session.storeId },
    data: {
      name,
      address: body.address?.trim() || null,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      taxRate: new Prisma.Decimal(taxRate),
      category: body.category?.trim() || null,
      businessType: body.businessType?.trim() || null,
    },
  });

  return NextResponse.json({ store: { id: store.id, name: store.name } });
}
