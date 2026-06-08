"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  PackagePlus,
  ShoppingCart,
  Boxes,
  Wallet,
  Users,
  FileBarChart,
  Settings,
  Rocket,
} from "lucide-react";

type Faq = { q: string; a: React.ReactNode };
type Section = { title: string; icon: React.ElementType; items: Faq[] };

const SECTIONS: Section[] = [
  {
    title: "Memulai",
    icon: Rocket,
    items: [
      {
        q: "Bagaimana langkah pertama setelah daftar?",
        a: (
          <>
            Mulai dari <b>Inventaris → Tambah Produk</b> untuk mengisi katalog. Setelah ada produk,
            buka <b>Penjualan &amp; POS</b> untuk mencatat transaksi pertama. Angka di Dasbor akan
            terisi otomatis.
          </>
        ),
      },
      {
        q: "Apa bedanya produk Fisik dan Digital?",
        a: (
          <>
            <b>Fisik</b> punya stok yang berkurang tiap terjual (mis. makanan, baju).{" "}
            <b>Digital</b> tidak memakai stok (mis. e-voucher, jasa, e-book).
          </>
        ),
      },
    ],
  },
  {
    title: "Produk & Stok",
    icon: Boxes,
    items: [
      {
        q: "Kenapa harga yang saya ketik jadi salah (mis. 300.000 jadi 300)?",
        a: (
          <>
            Itu sudah diperbaiki. Sekarang kolom harga otomatis memberi pemisah ribuan — cukup ketik
            angkanya (mis. <b>300000</b>) dan akan tampil <b>300.000</b>. Jika ada produk lama yang
            terlanjur salah, buka produknya lalu perbaiki harganya.
          </>
        ),
      },
      {
        q: "Apa itu 'Stok minimum'?",
        a: (
          <>
            Batas peringatan. Jika stok produk turun sampai sama atau di bawah angka ini, produk akan
            ditandai <b>“stok menipis”</b> di Dasbor & Inventaris agar kamu segera restock.
          </>
        ),
      },
      {
        q: "Bagaimana menambah foto produk?",
        a: (
          <>
            Saat menambah/mengedit produk, klik <b>Unggah foto</b> di bagian atas form. Foto otomatis
            dikompres agar ringan, dan tampil di daftar produk maupun di kasir.
          </>
        ),
      },
      {
        q: "Bagaimana membuat varian (mis. ukuran/warna)?",
        a: (
          <>
            Di form produk, klik <b>Tambah varian</b>. Tiap varian punya harga & stok sendiri,
            misalnya “Reguler” dan “Large”.
          </>
        ),
      },
      {
        q: "Apakah produk yang dihapus benar-benar hilang?",
        a: "Tidak. Produk dinonaktifkan agar riwayat transaksi lama tetap utuh, tapi tidak lagi muncul di katalog & kasir.",
      },
    ],
  },
  {
    title: "Kasir (POS)",
    icon: ShoppingCart,
    items: [
      {
        q: "Bagaimana cara mencatat penjualan?",
        a: (
          <>
            Buka <b>Penjualan &amp; POS</b>, klik produk untuk memasukkannya ke keranjang, atur
            jumlah, pilih metode bayar, lalu <b>Bayar Sekarang</b>. Stok & keuangan ter-update
            otomatis.
          </>
        ),
      },
      {
        q: "Apakah stok berkurang otomatis?",
        a: "Ya. Setiap transaksi lunas mengurangi stok produk fisik dan tercatat di riwayat pergerakan stok.",
      },
    ],
  },
  {
    title: "Keuangan & Laporan",
    icon: Wallet,
    items: [
      {
        q: "Dari mana data Keuangan berasal?",
        a: (
          <>
            Penjualan dari kasir tercatat <b>otomatis</b> sebagai pemasukan. Kamu juga bisa menambah
            pemasukan/pengeluaran manual (mis. beli bahan, bayar listrik) lewat tombol{" "}
            <b>Catat Transaksi</b>.
          </>
        ),
      },
      {
        q: "Bagaimana cara melihat laba?",
        a: (
          <>
            Buka <b>Laporan</b>. Ada Laba/Rugi bulan ini (omzet − HPP − pengeluaran), produk terlaris,
            dan penjualan per channel. Bisa diunduh sebagai CSV (buka di Excel).
          </>
        ),
      },
    ],
  },
  {
    title: "Pelanggan & Pengaturan",
    icon: Settings,
    items: [
      {
        q: "Bagaimana mengatur pajak (PPN)?",
        a: (
          <>
            Buka <b>Pengaturan</b> → isi <b>Pajak/PPN (%)</b>. Nilai ini otomatis dipakai menghitung
            pajak di kasir.
          </>
        ),
      },
      {
        q: "Apakah saya bisa menambah akun kasir/staf?",
        a: "Manajemen staf (menambah akun Kasir/Staf Gudang dengan hak akses berbeda) sedang dalam pengembangan dan akan segera hadir.",
      },
    ],
  },
];

export default function FaqClient() {
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bantuan &amp; FAQ</h1>
        <p className="text-sm text-zinc-500">Panduan singkat & jawaban pertanyaan umum.</p>
      </div>

      {/* Quick start */}
      <div className="rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-zinc-900">Mulai cepat dalam 3 langkah 🚀</h2>
        <ol className="mt-3 space-y-2 text-sm text-zinc-700">
          <li className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-yellow-400">1</span>
            <Link href="/inventory" className="font-semibold underline-offset-2 hover:underline">
              Tambah produk
            </Link>{" "}
            di Inventaris
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-yellow-400">2</span>
            <Link href="/pos" className="font-semibold underline-offset-2 hover:underline">
              Catat penjualan
            </Link>{" "}
            lewat kasir
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-yellow-400">3</span>
            <Link href="/reports" className="font-semibold underline-offset-2 hover:underline">
              Pantau laporan
            </Link>{" "}
            & keuangan
          </li>
        </ol>
      </div>

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="mb-2 flex items-center gap-2">
              <section.icon className="h-4 w-4 text-yellow-500" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">
                {section.title}
              </h2>
            </div>
            <div className="space-y-2">
              {section.items.map((item, i) => (
                <FaqItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Shortcuts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <ShortcutCard href="/inventory" icon={PackagePlus} label="Tambah Produk" />
        <ShortcutCard href="/pos" icon={ShoppingCart} label="Buka Kasir" />
        <ShortcutCard href="/customers" icon={Users} label="Pelanggan" />
        <ShortcutCard href="/finance" icon={Wallet} label="Keuangan" />
        <ShortcutCard href="/reports" icon={FileBarChart} label="Laporan" />
        <ShortcutCard href="/settings" icon={Settings} label="Pengaturan" />
      </div>
    </>
  );
}

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-zinc-900">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="border-t border-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-600">{a}</div>}
    </div>
  );
}

function ShortcutCard({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-center transition hover:border-yellow-400 hover:shadow-sm"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-500">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-semibold text-zinc-700">{label}</span>
    </Link>
  );
}
