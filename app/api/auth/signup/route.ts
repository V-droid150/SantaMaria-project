import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signSession, SESSION_COOKIE } from "@/lib/session";
import { verifyTurnstile } from "@/lib/turnstile";

export async function POST(req: Request) {
  let body: { name?: string; email?: string; password?: string; captchaToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Nama, email, dan password wajib diisi" }, { status: 400 });
  }

  // Verifikasi anti-bot (Turnstile) — dilewati bila fitur belum dikonfigurasi.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!(await verifyTurnstile(body.captchaToken, ip))) {
    return NextResponse.json({ error: "Verifikasi anti-bot gagal. Coba lagi." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  // Setiap pendaftar membuat TOKO-nya sendiri (multi-tenant) dan menjadi ADMIN.
  // Nama toko sementara — akan diisi saat onboarding.
  const user = await prisma.$transaction(async (tx) => {
    const store = await tx.store.create({
      data: { name: `Toko ${name.split(" ")[0]}` },
    });
    return tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: Role.ADMIN,
        storeId: store.id,
      },
    });
  });

  const token = await signSession({
    userId: user.id,
    name: user.name,
    role: user.role,
    storeId: user.storeId,
    onboarded: false,
  });

  const res = NextResponse.json({ user: { id: user.id, name: user.name } }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
