import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { signSession, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Pesan error disamarkan agar tidak membocorkan akun mana yang ada.
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
  }

  // User yang daftar lewat Google tidak punya password.
  if (!user.passwordHash) {
    return NextResponse.json(
      { error: "Akun ini terdaftar via Google. Silakan masuk dengan Google." },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = await signSession({
    userId: user.id,
    name: user.name,
    role: user.role,
    storeId: user.storeId,
    onboarded: user.onboardedAt !== null,
  });

  const res = NextResponse.json({
    user: { id: user.id, name: user.name, role: user.role },
  });

  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });

  return res;
}
