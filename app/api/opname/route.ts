import { NextResponse } from "next/server";
import { StockMovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

type ItemInput = { variantId: string; physicalStock: number };
type Body = { note?: string; items?: ItemInput[] };

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!canAccess(session.role, "/opname")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const items = (body.items ?? []).filter(
    (i) => i.variantId && Number.isFinite(i.physicalStock) && i.physicalStock >= 0
  );
  if (items.length === 0) {
    return NextResponse.json({ error: "Tidak ada item untuk diopname" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Ambil varian (pastikan milik toko ini) + stok sistem saat ini.
      const variants = await tx.productVariant.findMany({
        where: { id: { in: items.map((i) => i.variantId) }, product: { storeId: session.storeId } },
        select: { id: true, stock: true },
      });
      const stockMap = new Map(variants.map((v) => [v.id, v.stock]));

      const opname = await tx.stockOpname.create({
        data: { note: body.note?.trim() || null, userId: session.userId },
      });

      let adjustedCount = 0;
      for (const item of items) {
        const systemStock = stockMap.get(item.variantId);
        if (systemStock === undefined) continue; // bukan milik toko -> lewati
        const physical = Math.trunc(item.physicalStock);
        const diff = physical - systemStock;

        await tx.stockOpnameItem.create({
          data: {
            opnameId: opname.id,
            variantId: item.variantId,
            systemStock,
            physicalStock: physical,
            difference: diff,
          },
        });

        if (diff !== 0) {
          adjustedCount++;
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: physical },
          });
          await tx.stockMovement.create({
            data: {
              type: StockMovementType.OPNAME,
              quantity: diff, // (+) lebih, (−) kurang
              variantId: item.variantId,
              userId: session.userId,
              note: `Stock opname ${opname.id.slice(-6)}`,
            },
          });
        }
      }

      return { opnameId: opname.id, adjustedCount };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan opname";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
