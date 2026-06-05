# SantaMaria — UMKM Dashboard

Aplikasi SaaS berbasis web untuk mengelola operasional UMKM yang menjual produk **fisik** maupun **digital**.

## Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS, Shadcn UI
- **Backend:** Next.js Route Handlers (API) / Node.js
- **Database & ORM:** PostgreSQL + Prisma ORM
- **Bahasa:** TypeScript

## Tema Visual

Minimalis, catchy, dan modern dengan palet **Kuning · Hitam · Putih**.

- **Putih / off-white** — background utama & card (clean white space)
- **Hitam / dark gray** (`zinc-900`) — teks, border, elemen solid (sidebar)
- **Kuning** (`yellow-400`) — aksen: tombol CTA, ikon, badge status, grafik, sorot metrik

## Modul

| Modul | Cakupan |
|-------|---------|
| Dasbor | Key metrics, grafik tren, notifikasi stok & tagihan |
| Penjualan & POS | Kasir, status pesanan, multi-channel, struk thermal |
| Inventaris | Katalog, varian, stok real-time, stock opname |
| Keuangan | Arus kas, pemasukan/pengeluaran, hutang/piutang |
| CRM | Database pelanggan, riwayat transaksi, poin/diskon |
| Laporan | Laba/rugi, best seller, shift kasir, ekspor Excel/PDF |
| Pengaturan & RBAC | Role (Admin, Kasir, Staf Gudang), pengaturan toko |

## Status Pengembangan

### ✅ Selesai
- **Skema DB** — `prisma/schema.prisma`: RBAC, produk + varian, order, arus kas, hutang/piutang, audit trail stok (`StockMovement`).
- **UI Dasbor** — `components/Dashboard.tsx`: sidebar, metric cards, grafik, tabel pesanan, responsif.
- **Scaffolding Next.js 14** — App Router, Tailwind + token tema (Shadcn-ready), `lib/utils`, `lib/prisma`.
- **Grafik Recharts** — `components/charts/RevenueChart.tsx` (area chart bertema kuning).
- **Auth + RBAC** — session JWT (jose) di cookie httpOnly, `middleware.ts` proteksi route per-role, halaman `/login`, seed 3 user.
- **Modul POS** — `/pos` terminal kasir + `/api/orders` (transaksi atomik: kurangi stok + `StockMovement` + `CashFlow`).

### ⏭️ Berikutnya
- Modul Inventaris (CRUD produk/varian, stock opname UI)
- Modul Keuangan (input arus kas, hutang/piutang)
- Struk thermal, laporan & ekspor (Excel/PDF), CRM

### Akun demo (setelah `npm run db:seed`)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@santamaria.id | password123 |
| Kasir | kasir@santamaria.id | password123 |
| Staf Gudang | gudang@santamaria.id | password123 |

## Setup

```bash
npm install
cp .env.example .env          # isi DATABASE_URL
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

> Catatan: Tahap 1 berisi skema & komponen UI. Scaffolding Next.js penuh menyusul di tahap berikutnya.
