import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { signSession, SESSION_COOKIE } from "@/lib/session";

// Edit profil sendiri (semua role): nama, foto, dan password.

type Body = {
  name?: string;
  image?: string | null;
  currentPassword?: string;
  newPassword?: string;
};

const MAX_IMAGE_LEN = 2_800_000;
function sanitizeImage(image: string | null): string | null {
  if (!image) return null;
  if (image.length > MAX_IMAGE_LEN) throw new Error("Ukuran foto terlalu besar");
  if (!/^data:image\/|^https?:\/\//.test(image)) throw new Error("Format foto tidak valid");
  return image;
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });

  const data: { name?: string; image?: string | null; passwordHash?: string } = {};

  // Nama
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
    data.name = name;
  }

  // Foto
  if (body.image !== undefined) {
    try {
      data.image = sanitizeImage(body.image);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  // Password (opsional)
  if (body.newPassword) {
    if (body.newPassword.length < 8) {
      return NextResponse.json({ error: "Password baru minimal 8 karakter" }, { status: 400 });
    }
    // Jika sudah punya password, wajib verifikasi password lama.
    if (user.passwordHash) {
      const ok = body.currentPassword
        ? await verifyPassword(body.currentPassword, user.passwordHash)
        : false;
      if (!ok) return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });
    }
    data.passwordHash = await hashPassword(body.newPassword);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data });

  const res = NextResponse.json({ ok: true, hasPassword: updated.passwordHash !== null });

  // Bila nama berubah, perbarui cookie sesi agar topbar/menu ikut ter-update.
  if (data.name && data.name !== session.name) {
    const token = await signSession({
      userId: session.userId,
      name: data.name,
      role: session.role,
      storeId: session.storeId,
      onboarded: session.onboarded,
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return res;
}
