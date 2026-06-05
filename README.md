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

### ✅ Tahap 1 (selesai)
- `prisma/schema.prisma` — skema database dengan RBAC, produk + varian, order, arus kas, hutang/piutang, dan audit trail stok (`StockMovement`) untuk pelacakan stok real-time.
- `components/Dashboard.tsx` — UI Dasbor Utama (sidebar, metric cards, grafik tren, tabel pesanan) — responsif & sesuai tema.

### ⏭️ Berikutnya
- Inisialisasi project Next.js penuh + setup Shadcn UI
- Auth + RBAC middleware
- Modul POS, inventaris, keuangan
- Integrasi grafik (Recharts) menggantikan placeholder

## Setup

```bash
npm install
cp .env.example .env          # isi DATABASE_URL
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

> Catatan: Tahap 1 berisi skema & komponen UI. Scaffolding Next.js penuh menyusul di tahap berikutnya.
