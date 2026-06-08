import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

type Body = { name?: string; phone?: string; email?: string; address?: string };

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!canAccess(session.role, "/customers")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "Nama pelanggan wajib diisi" }, { status: 400 });

  const customer = await prisma.customer.create({
    data: {
      name,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      address: body.address?.trim() || null,
      storeId: session.storeId,
    },
  });

  return NextResponse.json({ customer }, { status: 201 });
}
