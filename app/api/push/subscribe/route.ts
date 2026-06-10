import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// Simpan / perbarui langganan Web Push milik user yang sedang login.
type Body = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const endpoint = body.endpoint;
  const p256dh = body.keys?.p256dh;
  const auth = body.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Langganan tidak lengkap" }, { status: 400 });
  }

  // Satu endpoint = satu perangkat. Bila perangkat berpindah user, tautkan ulang.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh, auth, userId: session.userId },
    create: { endpoint, p256dh, auth, userId: session.userId },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

// Hentikan langganan perangkat ini.
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  let body: { endpoint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (body.endpoint) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: body.endpoint, userId: session.userId },
    });
  }
  return NextResponse.json({ ok: true });
}
