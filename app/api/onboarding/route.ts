import { NextResponse } from "next/server";
import { ProductFocus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { signSession, SESSION_COOKIE } from "@/lib/session";
import { generateUniqueSlug } from "@/lib/slug";

type Body = {
  storeName?: string;
  businessType?: string;
  category?: string;
  productFocus?: ProductFocus;
  scale?: string;
  goals?: string[];
  channels?: string[];
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const storeName = body.storeName?.trim();
  if (!storeName) {
    return NextResponse.json({ error: "Nama toko wajib diisi" }, { status: 400 });
  }

  const focus = Object.values(ProductFocus).includes(body.productFocus as ProductFocus)
    ? (body.productFocus as ProductFocus)
    : ProductFocus.PHYSICAL;

  // Simpan profil bisnis & tandai onboarding selesai (transaksi).
  // Buat slug publik unik bila toko belum punya.
  const current = await prisma.store.findUnique({
    where: { id: session.storeId },
    select: { slug: true },
  });
  const slug = current?.slug ?? (await generateUniqueSlug(storeName));

  const user = await prisma.$transaction(async (tx) => {
    await tx.store.update({
      where: { id: session.storeId },
      data: {
        name: storeName,
        slug,
        businessType: body.businessType ?? null,
        category: body.category ?? null,
        productFocus: focus,
        scale: body.scale ?? null,
        goals: body.goals ?? [],
        channels: body.channels ?? [],
      },
    });
    return tx.user.update({
      where: { id: session.userId },
      data: { onboardedAt: new Date() },
    });
  });

  // Perbarui session: onboarded = true.
  const token = await signSession({
    userId: user.id,
    name: user.name,
    role: user.role,
    storeId: user.storeId,
    onboarded: true,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
