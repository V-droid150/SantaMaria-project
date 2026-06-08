import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!canAccess(session.role, "/finance")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const existing = await prisma.cashFlow.findFirst({
    where: { id: params.id, storeId: session.storeId },
  });
  if (!existing) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

  // Cegah hapus arus kas yang otomatis dari pesanan (jaga konsistensi).
  if (existing.orderId) {
    return NextResponse.json(
      { error: "Arus kas dari penjualan tidak bisa dihapus manual" },
      { status: 400 }
    );
  }

  await prisma.cashFlow.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
