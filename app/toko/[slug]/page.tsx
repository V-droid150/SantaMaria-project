import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PublicStoreClient, { type PubProduct } from "@/components/store/PublicStoreClient";

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const store = await prisma.store.findUnique({
    where: { slug: params.slug },
    select: { name: true },
  });
  return {
    title: store ? `${store.name} — Katalog Produk` : "Toko tidak ditemukan",
    description: store ? `Lihat & pesan produk dari ${store.name}.` : undefined,
  };
}

export default async function PublicStorePage({ params }: Params) {
  const store = await prisma.store.findUnique({
    where: { slug: params.slug },
    select: {
      name: true,
      slug: true,
      address: true,
      phone: true,
      category: true,
      products: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          type: true,
          imageUrl: true,
          videoUrl: true,
          category: { select: { name: true } },
          variants: {
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: { id: true, name: true, price: true, stock: true },
          },
        },
      },
    },
  });

  if (!store) notFound();

  const products: PubProduct[] = store.products
    .filter((p) => p.variants.length > 0)
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category?.name ?? null,
      image: p.imageUrl,
      video: p.videoUrl,
      type: p.type,
      variants: p.variants.map((v) => ({
        id: v.id,
        name: v.name,
        price: Number(v.price),
        stock: v.stock,
      })),
    }));

  return (
    <PublicStoreClient
      store={{
        name: store.name,
        slug: store.slug!,
        address: store.address,
        phone: store.phone,
        category: store.category,
      }}
      products={products}
    />
  );
}
