import { NextResponse } from "next/server";
import { Prisma, ProductType, StockMovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

type VariantInput = {
  id?: string;
  name?: string;
  sku?: string;
  price: number;
  costPrice?: number;
  stock?: number;
  reorderPoint?: number;
};
type Body = {
  name?: string;
  description?: string;
  type?: ProductType;
  categoryName?: string;
  image?: string | null;
  videoUrl?: string | null;
  digitalUrl?: string | null;
  digitalInfo?: string | null;
  variants?: VariantInput[];
};

const MAX_IMAGE_LEN = 2_800_000;
function sanitizeImage(image?: string | null): string | null {
  if (!image) return null;
  if (image.length > MAX_IMAGE_LEN) throw new Error("Ukuran foto terlalu besar");
  if (!/^data:image\/|^https?:\/\//.test(image)) throw new Error("Format foto tidak valid");
  return image;
}

function sanitizeVideo(url?: string | null): string | null {
  const v = url?.trim();
  if (!v) return null;
  if (!/^https?:\/\//.test(v)) throw new Error("Link video harus diawali http(s)://");
  if (v.length > 500) throw new Error("Link video terlalu panjang");
  return v;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!canAccess(session.role, "/inventory")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const existing = await prisma.product.findFirst({
    where: { id: params.id, storeId: session.storeId },
    include: { variants: true },
  });
  if (!existing) return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "Nama produk wajib diisi" }, { status: 400 });
  const type = body.type === "DIGITAL" ? ProductType.DIGITAL : ProductType.PHYSICAL;
  const incoming = (body.variants ?? []).filter((v) => v.price >= 0);
  if (incoming.length === 0) {
    return NextResponse.json({ error: "Minimal satu varian" }, { status: 400 });
  }

  let imageUrl: string | null;
  let videoUrl: string | null;
  try {
    imageUrl = sanitizeImage(body.image);
    videoUrl = sanitizeVideo(body.videoUrl);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      let categoryId: string | null = null;
      const catName = body.categoryName?.trim();
      if (catName) {
        const cat = await tx.category.upsert({
          where: { storeId_name: { storeId: session.storeId, name: catName } },
          update: {},
          create: { name: catName, storeId: session.storeId },
        });
        categoryId = cat.id;
      }

      await tx.product.update({
        where: { id: existing.id },
        data: {
          name,
          description: body.description?.trim() || null,
          type,
          categoryId,
          imageUrl,
          videoUrl,
          digitalUrl: type === ProductType.DIGITAL ? body.digitalUrl?.trim() || null : null,
          digitalInfo: type === ProductType.DIGITAL ? body.digitalInfo?.trim() || null : null,
        },
      });

      const keptIds = new Set<string>();
      for (const v of incoming) {
        const newStock = type === ProductType.PHYSICAL ? Math.max(0, Math.trunc(v.stock ?? 0)) : 0;
        const current = v.id ? existing.variants.find((x) => x.id === v.id) : undefined;

        if (current) {
          keptIds.add(current.id);
          await tx.productVariant.update({
            where: { id: current.id },
            data: {
              name: v.name?.trim() || "Default",
              sku: v.sku?.trim() || null,
              price: new Prisma.Decimal(v.price),
              costPrice: new Prisma.Decimal(v.costPrice ?? 0),
              reorderPoint: Math.max(0, Math.trunc(v.reorderPoint ?? 0)),
              stock: newStock,
            },
          });
          // Selisih stok dicatat sebagai penyesuaian (audit).
          const diff = newStock - current.stock;
          if (type === ProductType.PHYSICAL && diff !== 0) {
            await tx.stockMovement.create({
              data: {
                type: StockMovementType.ADJUSTMENT,
                quantity: diff,
                variantId: current.id,
                userId: session.userId,
                note: "Penyesuaian stok (edit produk)",
              },
            });
          }
        } else {
          const createdVar = await tx.productVariant.create({
            data: {
              name: v.name?.trim() || "Default",
              sku: v.sku?.trim() || null,
              price: new Prisma.Decimal(v.price),
              costPrice: new Prisma.Decimal(v.costPrice ?? 0),
              reorderPoint: Math.max(0, Math.trunc(v.reorderPoint ?? 0)),
              stock: newStock,
              productId: existing.id,
            },
          });
          keptIds.add(createdVar.id);
          if (type === ProductType.PHYSICAL && newStock > 0) {
            await tx.stockMovement.create({
              data: {
                type: StockMovementType.ADJUSTMENT,
                quantity: newStock,
                variantId: createdVar.id,
                userId: session.userId,
                note: "Stok awal (varian baru)",
              },
            });
          }
        }
      }

      // Varian yang dihapus dari form -> nonaktifkan (jaga histori transaksi).
      const toDeactivate = existing.variants.filter((x) => !keptIds.has(x.id) && x.isActive);
      for (const v of toDeactivate) {
        await tx.productVariant.update({ where: { id: v.id }, data: { isActive: false } });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui produk";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!canAccess(session.role, "/inventory")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const existing = await prisma.product.findFirst({
    where: { id: params.id, storeId: session.storeId },
  });
  if (!existing) return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });

  // Soft delete agar histori pesanan tetap utuh.
  await prisma.product.update({
    where: { id: existing.id },
    data: { isActive: false, variants: { updateMany: { where: {}, data: { isActive: false } } } },
  });

  return NextResponse.json({ ok: true });
}
