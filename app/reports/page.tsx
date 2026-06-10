import { redirect } from "next/navigation";
import { TrendingUp, Package, Radio } from "lucide-react";
import { getSession } from "@/lib/auth";
import { canAccess, ROLE_LABEL } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { rupiah, angka } from "@/lib/format";
import { getServerT } from "@/lib/i18n-server";
import AppShell from "@/components/app/AppShell";
import ReportExport from "@/components/reports/ReportExport";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/reports");
  if (!canAccess(session.role, "/reports")) redirect("/dashboard?error=forbidden");

  const { t } = getServerT();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const storeId = session.storeId;
  const paidThisMonth = {
    order: { storeId, paymentStatus: "PAID" as const, createdAt: { gte: monthStart } },
  };

  const [store, items, expenseAgg, channelAgg, bestRaw] = await Promise.all([
    prisma.store.findUnique({ where: { id: storeId }, select: { name: true } }),
    // Untuk omzet & HPP
    prisma.orderItem.findMany({
      where: paidThisMonth,
      select: { quantity: true, unitPrice: true, costPrice: true },
    }),
    prisma.cashFlow.aggregate({
      where: { storeId, type: "EXPENSE", occurredAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.order.groupBy({
      by: ["channel"],
      where: { storeId, paymentStatus: "PAID", createdAt: { gte: monthStart } },
      _sum: { grandTotal: true },
      _count: true,
    }),
    prisma.orderItem.groupBy({
      by: ["variantId"],
      where: paidThisMonth,
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  let omzet = 0;
  let hpp = 0;
  for (const it of items) {
    omzet += Number(it.unitPrice) * it.quantity;
    hpp += Number(it.costPrice) * it.quantity;
  }
  const labaKotor = omzet - hpp;
  const pengeluaran = Number(expenseAgg._sum.amount ?? 0);
  const labaBersih = labaKotor - pengeluaran;

  // Nama produk untuk best seller
  const variantIds = bestRaw.map((b) => b.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: { id: true, name: true, product: { select: { name: true } } },
  });
  const vmap = new Map(variants.map((v) => [v.id, v]));
  const bestSellers = bestRaw.map((b) => {
    const v = vmap.get(b.variantId);
    const label = v ? v.product.name + (v.name !== "Default" ? ` · ${v.name}` : "") : "—";
    return { name: label, qty: b._sum.quantity ?? 0, revenue: Number(b._sum.subtotal ?? 0) };
  });

  const channels = channelAgg
    .map((c) => ({
      channel: t(`chan.${c.channel}`),
      total: Number(c._sum.grandTotal ?? 0),
      count: c._count,
    }))
    .sort((a, b) => b.total - a.total);

  const monthName = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const hasData = items.length > 0;

  return (
    <AppShell userName={session.name} roleLabel={ROLE_LABEL[session.role]} role={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("rep.title")}</h1>
          <p className="text-sm text-zinc-500">
            {t("rep.subtitle")} — {monthName}
          </p>
        </div>
        <ReportExport
          storeName={store?.name ?? "SantaMaria"}
          monthName={monthName}
          labaRugi={{ omzet, hpp, labaKotor, pengeluaran, labaBersih }}
          bestSellers={bestSellers}
          channels={channels}
        />
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center text-zinc-400">
          <TrendingUp className="h-9 w-9" />
          <p className="text-sm">{t("rep.empty")}</p>
        </div>
      ) : (
        <>
          {/* Laba / Rugi */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <h2 className="text-base font-bold">{t("rep.plTitle")}</h2>
            <div className="mt-4 space-y-2 text-sm">
              <Row label={t("rep.omzet")} value={rupiah(omzet)} />
              <Row label={t("rep.hpp")} value={`− ${rupiah(hpp)}`} muted />
              <Row label={t("rep.grossProfit")} value={rupiah(labaKotor)} bold />
              <Row label={t("rep.opex")} value={`− ${rupiah(pengeluaran)}`} muted />
              <div className="border-t border-dashed border-zinc-200 pt-2">
                <Row
                  label={t("rep.netProfit")}
                  value={rupiah(labaBersih)}
                  bold
                  highlight={labaBersih >= 0}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Best seller */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-yellow-500" />
                <h2 className="text-base font-bold">{t("rep.bestSellers")}</h2>
              </div>
              <ul className="space-y-3">
                {bestSellers.map((b, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-yellow-400 text-xs font-bold text-zinc-900">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{b.name}</p>
                      <p className="text-xs text-zinc-500">{angka(b.qty)} {t("rep.sold")}</p>
                    </div>
                    <span className="text-sm font-semibold text-zinc-900">{rupiah(b.revenue)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Channel */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Radio className="h-5 w-5 text-yellow-500" />
                <h2 className="text-base font-bold">{t("rep.perChannel")}</h2>
              </div>
              <ul className="space-y-3">
                {channels.map((c, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-zinc-800">{c.channel}</p>
                      <p className="text-xs text-zinc-500">{angka(c.count)} {t("rep.tx")}</p>
                    </div>
                    <span className="font-semibold text-zinc-900">{rupiah(c.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Row({
  label,
  value,
  bold = false,
  muted = false,
  highlight = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-zinc-500" : "text-zinc-700"}>{label}</span>
      <span
        className={`${bold ? "font-bold" : "font-medium"} ${
          highlight ? "text-yellow-600" : "text-zinc-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
