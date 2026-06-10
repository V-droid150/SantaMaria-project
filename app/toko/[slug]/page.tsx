import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { isMidtransConfigured } from "@/lib/midtrans";
import PublicStoreClient, { type PubProduct } from "@/components/store/PublicStoreClient";

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const store = await prisma.store.findUnique({
    where: { slug: params.slug },
    select: {
      name: true,
      category: true,
      address: true,
      // Hanya gambar ber-URL http (crawler tak bisa baca base64) utk preview share.
      products: {
        where: { isActive: true, imageUrl: { startsWith: "http" } },
        select: { imageUrl: true },
        take: 1,
      },
    },
  });
  if (!store) return { title: "Toko tidak ditemukan" };

  const title = `${store.name} — Katalog Produk`;
  const description = `Belanja & pesan produk dari ${store.name}${
    store.category ? ` · ${store.category}` : ""
  }. Pesan online, bayar praktis.`;
  const ogImage = store.products[0]?.imageUrl || "/icon-512.png";

  return {
    // Pastikan URL gambar relatif (/icon) jadi absolut saat dibagikan.
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL || "https://santa-maria-project.vercel.app"
    ),
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "SantaMaria",
      images: [{ url: ogImage }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
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
      payoutBank: true,
      payoutAccount: true,
      payoutName: true,
      qrisImageUrl: true,
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

  const hasManual = Boolean(store.payoutBank || store.payoutAccount || store.qrisImageUrl);

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
      payment={{
        autoEnabled: isMidtransConfigured(),
        manualEnabled: hasManual,
        bank: store.payoutBank,
        account: store.payoutAccount,
        accountName: store.payoutName,
        qris: store.qrisImageUrl,
      }}
    />
  );
}
