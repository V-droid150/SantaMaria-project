"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wallet,
  Users,
  FileBarChart,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  AlertTriangle,
  CircleDollarSign,
  Receipt,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Tema: KUNING (aksen) · HITAM (solid/teks) · PUTIH (background)             */
/* Minimalis, catchy, modern, responsif (mobile / tablet / desktop).          */
/* -------------------------------------------------------------------------- */

type NavItem = {
  label: string;
  icon: React.ElementType;
  active?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dasbor", icon: LayoutDashboard, active: true },
  { label: "Penjualan & POS", icon: ShoppingCart },
  { label: "Inventaris", icon: Package },
  { label: "Keuangan", icon: Wallet },
  { label: "Pelanggan", icon: Users },
  { label: "Laporan", icon: FileBarChart },
  { label: "Pengaturan", icon: Settings },
];

type Metric = {
  label: string;
  value: string;
  delta: string;
  trendUp: boolean;
  icon: React.ElementType;
};

const METRICS: Metric[] = [
  {
    label: "Pendapatan",
    value: "Rp 48.250.000",
    delta: "+12,5%",
    trendUp: true,
    icon: CircleDollarSign,
  },
  {
    label: "Laba Bersih",
    value: "Rp 14.870.000",
    delta: "+8,2%",
    trendUp: true,
    icon: TrendingUp,
  },
  {
    label: "Total Pesanan",
    value: "1.284",
    delta: "+3,1%",
    trendUp: true,
    icon: Receipt,
  },
  {
    label: "Stok Menipis",
    value: "7 Produk",
    delta: "-2 dari kemarin",
    trendUp: false,
    icon: AlertTriangle,
  },
];

// Data dummy grafik tren (tinggi bar dalam %)
const TREND_BARS = [42, 58, 35, 70, 52, 88, 64, 76, 49, 92, 68, 80];
const TREND_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

type Order = {
  id: string;
  customer: string;
  channel: string;
  total: string;
  status: "Lunas" | "Pending" | "Diproses";
};

const RECENT_ORDERS: Order[] = [
  { id: "INV-0042", customer: "Budi Santoso", channel: "POS", total: "Rp 125.000", status: "Lunas" },
  { id: "INV-0041", customer: "Siti Aminah", channel: "Online", total: "Rp 340.000", status: "Diproses" },
  { id: "INV-0040", customer: "Toko Makmur", channel: "WhatsApp", total: "Rp 1.250.000", status: "Pending" },
  { id: "INV-0039", customer: "Rina Wati", channel: "Marketplace", total: "Rp 89.000", status: "Lunas" },
  { id: "INV-0038", customer: "Ahmad Fauzi", channel: "POS", total: "Rp 215.000", status: "Lunas" },
];

const STATUS_STYLE: Record<Order["status"], string> = {
  Lunas: "bg-yellow-400 text-zinc-900",
  Diproses: "bg-zinc-900 text-white",
  Pending: "bg-white text-zinc-900 border border-zinc-300",
};

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900">
      {/* ---------- Sidebar (Hitam / Dark) ---------- */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Overlay untuk mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* ---------- Area konten ---------- */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-md sm:px-6">
          <button
            className="rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="relative hidden flex-1 max-w-md sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari produk, pesanan, pelanggan..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/40"
            />
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button className="relative rounded-lg p-2 text-zinc-700 hover:bg-zinc-100" aria-label="Notifikasi">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-yellow-400 ring-2 ring-white" />
            </button>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white py-1 pl-1 pr-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-sm font-bold text-zinc-900">
                SM
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold leading-tight">Admin</p>
                <p className="text-[11px] leading-tight text-zinc-500">Pemilik Toko</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
          {/* Heading */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Selamat datang kembali 👋
            </h1>
            <p className="text-sm text-zinc-500">
              Ringkasan performa toko Anda hari ini, Jumat 5 Juni 2026.
            </p>
          </div>

          {/* ---------- Metric Cards ---------- */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {METRICS.map((m) => (
              <MetricCard key={m.label} metric={m} />
            ))}
          </section>

          {/* ---------- Grafik + Notifikasi ---------- */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <TrendChart />
            <AlertsCard />
          </section>

          {/* ---------- Tabel Pesanan Terbaru ---------- */}
          <RecentOrders />
        </main>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sidebar                                                                    */
/* -------------------------------------------------------------------------- */
function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-zinc-900 text-zinc-300 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400 font-extrabold text-zinc-900">
            S
          </div>
          <span className="text-lg font-bold text-white">
            Santa<span className="text-yellow-400">Maria</span>
          </span>
        </div>
        <button className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 lg:hidden" onClick={onClose} aria-label="Tutup menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href="#"
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                item.active
                  ? "bg-yellow-400 text-zinc-900 shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Footer kartu upgrade */}
      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="rounded-2xl bg-zinc-800 p-4">
          <p className="text-sm font-semibold text-white">Paket Pro</p>
          <p className="mt-1 text-xs text-zinc-400">
            Buka laporan lanjutan & multi-cabang.
          </p>
          <button className="mt-3 w-full rounded-lg bg-yellow-400 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-yellow-300">
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* Metric Card                                                                */
/* -------------------------------------------------------------------------- */
function MetricCard({ metric }: { metric: Metric }) {
  const { label, value, delta, trendUp, icon: Icon } = metric;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-400/10">
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-500 transition group-hover:bg-yellow-400 group-hover:text-zinc-900">
          <Icon className="h-5 w-5" />
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
            trendUp ? "bg-yellow-400/15 text-yellow-600" : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {delta}
        </span>
      </div>
      <p className="mt-4 text-sm text-zinc-500">{label}</p>
      {/* Angka penting disorot tebal & besar (catchy) */}
      <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">{value}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Grafik Tren (placeholder bar chart pakai div)                              */
/* -------------------------------------------------------------------------- */
function TrendChart() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold">Tren Pendapatan</h2>
          <p className="text-xs text-zinc-500">12 bulan terakhir</p>
        </div>
        <select className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium outline-none focus:border-yellow-400">
          <option>Tahun ini</option>
          <option>Tahun lalu</option>
        </select>
      </div>

      {/* Bar chart sederhana — ganti dengan Recharts/Chart.js saat integrasi */}
      <div className="mt-6 flex h-56 items-end gap-2 sm:gap-3">
        {TREND_BARS.map((h, i) => (
          <div key={i} className="group flex flex-1 flex-col items-center gap-2">
            <div className="relative flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-zinc-200 transition-all duration-300 group-hover:bg-yellow-400"
                style={{ height: `${h}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-zinc-400">{TREND_LABELS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Kartu Notifikasi & Peringatan                                              */
/* -------------------------------------------------------------------------- */
function AlertsCard() {
  const alerts = [
    { icon: AlertTriangle, title: "Stok Kopi Arabika menipis", desc: "Sisa 4 pcs", tone: "warn" },
    { icon: Receipt, title: "Tagihan supplier jatuh tempo", desc: "Besok · Rp 2.400.000", tone: "dark" },
    { icon: ArrowUpRight, title: "Best seller hari ini", desc: "Roti Bakar — 38 terjual", tone: "warn" },
  ];
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h2 className="text-base font-bold">Notifikasi & Peringatan</h2>
      <p className="text-xs text-zinc-500">Butuh perhatian Anda</p>

      <ul className="mt-4 space-y-3">
        {alerts.map((a, i) => {
          const Icon = a.icon;
          return (
            <li key={i} className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  a.tone === "warn" ? "bg-yellow-400 text-zinc-900" : "bg-zinc-900 text-yellow-400"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{a.title}</p>
                <p className="text-xs text-zinc-500">{a.desc}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <button className="mt-4 w-full rounded-xl border border-zinc-200 py-2 text-sm font-semibold text-zinc-700 transition hover:border-yellow-400 hover:text-zinc-900">
        Lihat semua
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tabel Pesanan Terbaru                                                      */
/* -------------------------------------------------------------------------- */
function RecentOrders() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between p-5">
        <div>
          <h2 className="text-base font-bold">Pesanan Terbaru</h2>
          <p className="text-xs text-zinc-500">5 transaksi terakhir</p>
        </div>
        <button className="inline-flex items-center gap-1 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-yellow-300">
          Lihat semua <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      {/* Tabel — scroll horizontal di mobile agar tetap rapi */}
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
            {RECENT_ORDERS.map((o) => (
              <tr key={o.id} className="transition hover:bg-yellow-400/5">
                <td className="px-5 py-4 font-semibold text-zinc-900">{o.id}</td>
                <td className="px-5 py-4 text-zinc-700">{o.customer}</td>
                <td className="px-5 py-4 text-zinc-500">{o.channel}</td>
                <td className="px-5 py-4 font-semibold text-zinc-900">{o.total}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[o.status]}`}>
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
