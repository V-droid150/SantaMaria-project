import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Package, MapPin, Phone, Store as StoreIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { rupiah } from "@/lib/format";

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const store = await prisma.store.findUnique({
    where: { slug: params.slug },
    select: { name: true },
  });
  return {
    title: store ? `${store.name} — Katalog Produk` : "Toko tidak ditemukan",
    description: store ? `Lihat produk yang dijual ${store.name}.` : undefined,
  };
}

export default async function PublicStorePage({ params }: Params) {
  const store = await prisma.store.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
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
          category: { select: { name: true } },
          variants: {
            where: { isActive: true },
            select: { price: true, stock: true },
          },
        },
      },
    },
  });

  if (!store) notFound();

  const products = store.products
    .filter((p) => p.variants.length > 0)
    .map((p) => {
      const prices = p.variants.map((v) => Number(v.price));
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
      const soldOut = p.type === "PHYSICAL" && totalStock <= 0;
      return {
        id: p.id,
        name: p.name,
        category: p.category?.name ?? null,
        image: p.imageUrl,
        priceLabel: min === max ? rupiah(min) : `${rupiah(min)} – ${rupiah(max)}`,
        soldOut,
      };
    });

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900">
      {/* Header toko */}
      <header className="border-b border-zinc-200 bg-zinc-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-zinc-900">
              <StoreIcon className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold sm:text-3xl">{store.name}</h1>
              {store.category && (
                <span className="mt-1 inline-block rounded-full bg-yellow-400/20 px-2.5 py-0.5 text-xs font-semibold text-yellow-400">
                  {store.category}
                </span>
              )}
              <div className="mt-2 space-y-0.5 text-sm text-zinc-400">
                {store.address && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {store.address}
                  </p>
                )}
                {store.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {store.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Katalog produk */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h2 className="mb-4 text-lg font-bold">Katalog Produk</h2>

        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white py-20 text-center text-zinc-400">
            <Package className="h-10 w-10" />
            <p className="text-sm">Belum ada produk yang ditampilkan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-yellow-400 hover:shadow-md"
              >
                <div className="relative flex aspect-square items-center justify-center bg-yellow-400/10 text-4xl">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    "🛍️"
                  )}
                  {p.soldOut && (
                    <span className="absolute right-2 top-2 rounded-full bg-zinc-900/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Stok habis
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <p className="line-clamp-2 text-sm font-semibold">{p.name}</p>
                  {p.category && <p className="text-xs text-zinc-400">{p.category}</p>}
                  <p className="mt-auto pt-2 text-sm font-bold text-zinc-900">{p.priceLabel}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-6 text-center">
        <p className="text-xs text-zinc-400">
          Didukung oleh <span className="font-bold text-zinc-600">SantaMaria</span>
        </p>
      </footer>
    </div>
  );
}
