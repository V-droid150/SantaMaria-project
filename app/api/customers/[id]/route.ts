import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

type Body = { name?: string; phone?: string; email?: string; address?: string };

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!canAccess(session.role, "/customers")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const existing = await prisma.customer.findFirst({
    where: { id: params.id, storeId: session.storeId },
  });
  if (!existing) return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "Nama pelanggan wajib diisi" }, { status: 400 });

  const customer = await prisma.customer.update({
    where: { id: existing.id },
    data: {
      name,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      address: body.address?.trim() || null,
    },
  });

  return NextResponse.json({ customer });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!canAccess(session.role, "/customers")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const existing = await prisma.customer.findFirst({
    where: { id: params.id, storeId: session.storeId },
  });
  if (!existing) return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });

  // Hapus pelanggan; relasi order pakai onDelete: SetNull sehingga histori aman.
  await prisma.customer.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
