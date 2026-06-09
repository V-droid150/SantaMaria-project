import type { Role } from "@prisma/client";

// Pemetaan hak akses per-role. Prefix path -> daftar role yang diizinkan.
// Dipakai middleware untuk proteksi route & UI untuk sembunyikan menu.
export const ROUTE_ACCESS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/dashboard", roles: ["ADMIN", "KASIR", "STAF_GUDANG"] },
  { prefix: "/pos", roles: ["ADMIN", "KASIR"] },
  { prefix: "/orders", roles: ["ADMIN", "KASIR"] },
  { prefix: "/inventory", roles: ["ADMIN", "STAF_GUDANG"] },
  { prefix: "/opname", roles: ["ADMIN", "STAF_GUDANG"] },
  { prefix: "/finance", roles: ["ADMIN"] },
  { prefix: "/customers", roles: ["ADMIN", "KASIR"] },
  { prefix: "/reports", roles: ["ADMIN"] },
  { prefix: "/settings", roles: ["ADMIN"] },
  { prefix: "/staff", roles: ["ADMIN"] },
];

// Cek apakah role boleh mengakses path tertentu.
// Path yang tidak terdaftar dianggap bebas (mis. halaman publik).
export function canAccess(role: Role, pathname: string): boolean {
  const rule = ROUTE_ACCESS.find((r) => pathname.startsWith(r.prefix));
  if (!rule) return true;
  return rule.roles.includes(role);
}

// Label role untuk ditampilkan di UI.
export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  KASIR: "Kasir",
  STAF_GUDANG: "Staf Gudang",
};
