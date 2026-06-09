import { NextResponse } from "next/server";
import { Prisma, ProductType, StockMovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

type VariantInput = {
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
  variants?: VariantInput[];
};

// Batas ukuran foto (data URL base64) ~2MB untuk cegah payload berlebihan.
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

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  if (!canAccess(session.role, "/inventory")) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "Nama produk wajib diisi" }, { status: 400 });
  const variants = (body.variants ?? []).filter((v) => v.price >= 0);
  if (variants.length === 0) {
    return NextResponse.json({ error: "Minimal satu varian dengan harga" }, { status: 400 });
  }

  const type = body.type === "DIGITAL" ? ProductType.DIGITAL : ProductType.PHYSICAL;

  let imageUrl: string | null;
  let videoUrl: string | null;
  try {
    imageUrl = sanitizeImage(body.image);
    videoUrl = sanitizeVideo(body.videoUrl);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      // Kategori (opsional) — upsert berdasarkan nama.
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

      const created = await tx.product.create({
        data: {
          name,
          description: body.description?.trim() || null,
          type,
          imageUrl,
          videoUrl,
          storeId: session.storeId,
          categoryId,
          variants: {
            create: variants.map((v) => ({
              name: v.name?.trim() || "Default",
              sku: v.sku?.trim() || null,
              price: new Prisma.Decimal(v.price),
              costPrice: new Prisma.Decimal(v.costPrice ?? 0),
              stock: type === ProductType.PHYSICAL ? Math.max(0, Math.trunc(v.stock ?? 0)) : 0,
              reorderPoint: Math.max(0, Math.trunc(v.reorderPoint ?? 0)),
            })),
          },
        },
        include: { variants: true },
      });

      // Catat stok awal sebagai StockMovement (audit) untuk produk fisik.
      if (type === ProductType.PHYSICAL) {
        for (const v of created.variants) {
          if (v.stock > 0) {
            await tx.stockMovement.create({
              data: {
                type: StockMovementType.ADJUSTMENT,
                quantity: v.stock,
                variantId: v.id,
                userId: session.userId,
                note: "Stok awal",
              },
            });
          }
        }
      }

      return created;
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal membuat produk";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
