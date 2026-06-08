import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CircleDollarSign,
  TrendingUp,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  PackagePlus,
  ShoppingCart,
  CalendarClock,
  Inbox,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/rbac";
import { getDashboardData } from "@/lib/dashboard";
import { rupiah, angka, tanggal } from "@/lib/format";
import AppShell from "@/components/app/AppShell";
import RevenueChart from "@/components/charts/RevenueChart";
import type { OrderStatus } from "@prisma/client";

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-yellow-400 text-zinc-900",
  COMPLETED: "bg-yellow-400 text-zinc-900",
  PENDING: "bg-white text-zinc-900 border border-zinc-300",
  CANCELLED: "bg-zinc-100 text-zinc-400",
  REFUNDED: "bg-zinc-100 text-zinc-400",
  DRAFT: "bg-zinc-100 text-zinc-400",
};

const STATUS_LABEL: Record<string, string> = {
  PAID: "Lunas",
  COMPLETED: "Selesai",
  PENDING: "Pending",
  CANCELLED: "Batal",
  REFUNDED: "Refund",
  DRAFT: "Draft",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/dashboard");

  const data = await getDashboardData(session.storeId);
  const firstName = session.name.split(" ")[0];
  const chartEmpty = data.trend.every((t) => t.revenue === 0);
  const hasAlerts = data.lowStock.length > 0 || data.dueDebts.length > 0;

  return (
    <AppShell userName={session.name} roleLabel={ROLE_LABEL[session.role]}>
      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Halo, {firstName} 👋</h1>
        <p className="text-sm text-zinc-500">Ringkasan toko kamu — {tanggal(new Date())}</p>
      </div>

      {/* Banner toko baru / kosong */}
      {!data.hasAnyData && (
        <div className="rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-zinc-900">Selamat datang di SantaMaria! 🎉</h2>
          <p className="mt-1 max-w-xl text-sm text-zinc-600">
            Tokomu masih kosong. Mulai dengan menambah produk, lalu catat penjualan pertamamu lewat
            kasir. Angka-angka di bawah akan terisi otomatis seiring transaksi masuk.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/inventory"
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              <PackagePlus className="h-4 w-4" /> Tambah Produk
            </Link>
            <Link
              href="/pos"
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-yellow-300"
            >
              <ShoppingCart className="h-4 w-4" /> Buka Kasir
            </Link>
          </div>
        </div>
      )}

      {/* Metric cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={CircleDollarSign} label="Pendapatan (bulan ini)" value={rupiah(data.revenue)} />
        <MetricCard icon={TrendingUp} label="Laba kotor (bulan ini)" value={rupiah(data.profit)} />
        <MetricCard icon={Receipt} label="Pesanan (bulan ini)" value={angka(data.orderCount)} />
        <MetricCard
          icon={AlertTriangle}
          label="Stok menipis"
          value={data.lowStockCount === 0 ? "Aman" : `${data.lowStockCount} produk`}
          muted={data.lowStockCount === 0}
        />
      </section>

      {/* Grafik + Peringatan */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="relative rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-2">
          <div>
            <h2 className="text-base font-bold">Tren Pendapatan</h2>
            <p className="text-xs text-zinc-500">12 bulan terakhir</p>
          </div>
          <div className="mt-6">
            <RevenueChart data={data.trend} />
          </div>
          {chartEmpty && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="rounded-lg bg-white/70 px-3 py-1.5 text-sm text-zinc-400 backdrop-blur-sm">
                Belum ada data penjualan
              </p>
            </div>
          )}
        </div>

        {/* Peringatan */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-base font-bold">Notifikasi & Peringatan</h2>
          <p className="text-xs text-zinc-500">Butuh perhatianmu</p>

          {!hasAlerts ? (
            <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center text-zinc-400">
              <Inbox className="h-8 w-8" />
              <p className="text-sm">Tidak ada peringatan. Semua aman 👌</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.lowStock.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-400 text-zinc-900">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">Stok menipis: {s.name}</p>
                    <p className="text-xs text-zinc-500">Sisa {s.stock}</p>
                  </div>
                </li>
              ))}
              {data.dueDebts.map((d) => (
                <li
                  key={d.id}
                  className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-yellow-400">
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{d.label}</p>
                    <p className="text-xs text-zinc-500">
                      {rupiah(d.amount)}
                      {d.dueDate ? ` · jatuh tempo ${tanggal(d.dueDate)}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Pesanan terbaru */}
      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between p-5">
          <div>
            <h2 className="text-base font-bold">Pesanan Terbaru</h2>
            <p className="text-xs text-zinc-500">Transaksi terakhir</p>
          </div>
          <Link
            href="/pos"
            className="inline-flex items-center gap-1 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-yellow-300"
          >
            Buka Kasir <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {data.recentOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 pb-10 pt-4 text-center text-zinc-400">
            <Receipt className="h-8 w-8" />
            <p className="text-sm">Belum ada pesanan. Transaksi pertamamu akan muncul di sini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-y border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-semibold">No. Pesanan</th>
                  <th className="px-5 py-3 font-semibold">Pelanggan</th>
                  <th className="px-5 py-3 font-semibold">Channel</th>
                  <th className="px-5 py-3 font-semibold">Total</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.recentOrders.map((o) => (
                  <tr key={o.id} className="transition hover:bg-yellow-400/5">
                    <td className="px-5 py-4 font-semibold text-zinc-900">{o.orderNumber}</td>
                    <td className="px-5 py-4 text-zinc-700">{o.customer}</td>
                    <td className="px-5 py-4 text-zinc-500">{o.channel}</td>
                    <td className="px-5 py-4 font-semibold text-zinc-900">{rupiah(o.total)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLE[o.status as OrderStatus] ?? "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {STATUS_LABEL[o.status as OrderStatus] ?? o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  muted = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="group rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-400/10">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
          muted
            ? "bg-zinc-100 text-zinc-400"
            : "bg-yellow-400/15 text-yellow-500 group-hover:bg-yellow-400 group-hover:text-zinc-900"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">{value}</p>
    </div>
  );
}
