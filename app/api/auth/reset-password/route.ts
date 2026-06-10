import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";

// Tetapkan password baru memakai token dari email.
export async function POST(req: Request) {
  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const token = body.token?.trim();
  const password = body.password ?? "";
  if (!token) return NextResponse.json({ error: "Token tidak valid" }, { status: 400 });
  if (password.length < 8) {
    return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Tautan reset tidak valid atau sudah kedaluwarsa." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Bersihkan token lain milik user ini.
    prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId, usedAt: null, id: { not: record.id } },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
