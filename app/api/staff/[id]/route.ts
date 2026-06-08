import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";
import { hashPassword } from "@/lib/password";

type Body = { name?: string; role?: Role; isActive?: boolean; password?: string };

const ALLOWED_ROLES: Role[] = [Role.ADMIN, Role.KASIR, Role.STAF_GUDANG];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!canAccess(session.role, "/staff")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const target = await prisma.user.findFirst({
    where: { id: params.id, storeId: session.storeId },
  });
  if (!target) return NextResponse.json({ error: "Staf tidak ditemukan" }, { status: 404 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const isSelf = target.id === session.userId;
  const data: { name?: string; role?: Role; isActive?: boolean; passwordHash?: string } = {};

  if (body.name?.trim()) data.name = body.name.trim();
  // Tidak boleh ubah role/status akun sendiri (cegah terkunci dari sistem).
  if (!isSelf && body.role && ALLOWED_ROLES.includes(body.role)) data.role = body.role;
  if (!isSelf && typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (body.password) {
    if (body.password.length < 8) {
      return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });
    }
    data.passwordHash = await hashPassword(body.password);
  }

  const user = await prisma.user.update({
    where: { id: target.id },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  return NextResponse.json({ user });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!canAccess(session.role, "/staff")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  if (params.id === session.userId) {
    return NextResponse.json({ error: "Tidak bisa menonaktifkan akun sendiri" }, { status: 400 });
  }

  const target = await prisma.user.findFirst({
    where: { id: params.id, storeId: session.storeId },
  });
  if (!target) return NextResponse.json({ error: "Staf tidak ditemukan" }, { status: 404 });

  // Nonaktifkan (soft) agar histori transaksi staf tetap utuh.
  await prisma.user.update({ where: { id: target.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
