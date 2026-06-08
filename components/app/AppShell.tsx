"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  LogOut,
  HelpCircle,
  UserCog,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { getInitials } from "@/lib/format";
import { canAccess } from "@/lib/rbac";

const NAV_ITEMS = [
  { label: "Dasbor", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Penjualan & POS", icon: ShoppingCart, href: "/pos" },
  { label: "Inventaris", icon: Package, href: "/inventory" },
  { label: "Keuangan", icon: Wallet, href: "/finance" },
  { label: "Pelanggan", icon: Users, href: "/customers" },
  { label: "Laporan", icon: FileBarChart, href: "/reports" },
  { label: "Staf", icon: UserCog, href: "/staff" },
  { label: "Pengaturan", icon: Settings, href: "/settings" },
  { label: "Bantuan & FAQ", icon: HelpCircle, href: "/help" },
];

// Layout back-office: sidebar (hitam) + topbar + area konten.
// Dipakai semua halaman dashboard/inventaris/keuangan/dst.
export default function AppShell({
  userName,
  roleLabel,
  role,
  children,
}: {
  userName: string;
  roleLabel: string;
  role: Role;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const navItems = NAV_ITEMS.filter((item) => canAccess(role, item.href));

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col bg-zinc-900 text-zinc-300 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400 font-extrabold text-zinc-900">
              S
            </div>
            <span className="text-lg font-bold text-white">
              Santa<span className="text-yellow-400">Maria</span>
            </span>
          </Link>
          <button
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-yellow-400 text-zinc-900 shadow-sm"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Konten */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-md sm:px-6">
          <button
            className="rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              className="relative rounded-lg p-2 text-zinc-700 hover:bg-zinc-100"
              aria-label="Notifikasi"
            >
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white py-1 pl-1 pr-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-sm font-bold text-zinc-900">
                {getInitials(userName)}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold leading-tight">{userName}</p>
                <p className="text-[11px] leading-tight text-zinc-500">{roleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
