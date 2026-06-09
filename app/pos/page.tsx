import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Settings2, ExternalLink, AlertTriangle } from "lucide-react";
import { getSession } from "@/lib/auth";
import { canAccess, ROLE_LABEL } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { rupiah } from "@/lib/format";
import { getServerT } from "@/lib/i18n-server";
import AppShell from "@/components/app/AppShell";

export default async function ProductsPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/pos");
  if (!canAccess(session.role, "/pos")) redirect("/dashboard?error=forbidden");

  const { t } = getServerT();
  const [store, products] = await Promise.all([
    prisma.store.findUnique({ where: { id: session.storeId }, select: { slug: true } }),
    prisma.product.findMany({
      where: { storeId: session.storeId, isActive: true },
      orderBy: { name: "asc" },
      include: {
        category: { select: { name: true } },
        variants: { where: { isActive: true }, select: { price: true, stock: true } },
      },
    }),
  ]);

  const canManage = canAccess(session.role, "/inventory");

  return (
    <AppShell userName={session.name} roleLabel={ROLE_LABEL[session.role]} role={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("prod.title")}</h1>
          <p className="text-sm text-zinc-500">{t("prod.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          {store?.slug && (
            <Link
              href={`/toko/${store.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-yellow-400 hover:text-zinc-900"
            >
              <ExternalLink className="h-4 w-4" /> {t("prod.viewStore")}
            </Link>
          )}
          {canManage && (
            <Link
              href="/inventory"
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-yellow-300"
            >
              <Settings2 className="h-4 w-4" /> {t("prod.manage")}
            </Link>
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center text-zinc-400">
          <Package className="h-9 w-9" />
          <p className="text-sm">{t("prod.empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => {
            const prices = p.variants.map((v) => Number(v.price));
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            const stock = p.variants.reduce((s, v) => s + v.stock, 0);
            const low = p.type === "PHYSICAL" && stock <= 0;
            return (
              <div
                key={p.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white"
              >
                <div className="flex aspect-square items-center justify-center bg-yellow-400/10 text-3xl">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    "🛍️"
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <p className="line-clamp-2 text-sm font-semibold">{p.name}</p>
                  {p.category?.name && <p className="text-xs text-zinc-400">{p.category.name}</p>}
                  <p className="mt-auto pt-2 text-sm font-bold text-zinc-900">
                    {prices.length === 0 ? "-" : min === max ? rupiah(min) : `${rupiah(min)} – ${rupiah(max)}`}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-400">
                    {low && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                    {p.type === "PHYSICAL" ? `${t("prod.stock")}: ${stock}` : "Digital"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
