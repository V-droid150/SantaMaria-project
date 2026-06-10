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
import { useI18n } from "@/components/i18n/LanguageProvider";

type Faq = { q: string; a: string };
type Section = { title: string; icon: React.ElementType; items: Faq[] };

export default function FaqClient() {
  const { lang } = useI18n();
  const en = lang === "en";
  const tr = (id: string, eng: string) => (en ? eng : id);

  const SECTIONS: Section[] = [
    {
      title: tr("Memulai", "Getting Started"),
      icon: Rocket,
      items: [
        {
          q: tr("Bagaimana langkah pertama setelah daftar?", "What's the first step after signing up?"),
          a: tr(
            "Mulai dari Inventaris → Tambah Produk untuk mengisi katalog. Setelah ada produk, buka Produk/Kasir untuk transaksi pertama. Angka di Dasbor terisi otomatis.",
            "Start from Inventory → Add Product to fill your catalog. Once you have products, open Products/Cashier for your first transaction. Dashboard numbers fill in automatically."
          ),
        },
        {
          q: tr("Apa bedanya produk Fisik dan Digital?", "What's the difference between Physical and Digital products?"),
          a: tr(
            "Fisik punya stok yang berkurang tiap terjual (mis. makanan, baju). Digital tidak memakai stok (mis. e-voucher, jasa, e-book) dan bisa mengirim link akses otomatis setelah lunas.",
            "Physical has stock that decreases on each sale (e.g. food, clothes). Digital uses no stock (e.g. e-vouchers, services, e-books) and can auto-deliver an access link once paid."
          ),
        },
      ],
    },
    {
      title: tr("Produk & Stok", "Products & Stock"),
      icon: Boxes,
      items: [
        {
          q: tr("Kenapa harga yang saya ketik jadi salah (mis. 300.000 jadi 300)?", "Why does my typed price look wrong (e.g. 300,000 becomes 300)?"),
          a: tr(
            "Itu sudah diperbaiki. Kolom harga otomatis memberi pemisah ribuan — cukup ketik angkanya (mis. 300000) dan tampil 300.000. Jika ada produk lama yang terlanjur salah, buka produknya lalu perbaiki harganya.",
            "That's fixed. The price field adds thousands separators automatically — just type the number (e.g. 300000) and it shows 300,000. If an old product has a wrong price, open it and correct it."
          ),
        },
        {
          q: tr("Apa itu 'Stok minimum'?", "What is 'Minimum stock'?"),
          a: tr(
            "Batas peringatan. Jika stok turun sampai sama atau di bawah angka ini, produk ditandai 'stok menipis' di Dasbor & Inventaris agar kamu segera restock.",
            "An alert threshold. If stock drops to or below this number, the product is flagged 'low stock' on the Dashboard & Inventory so you can restock in time."
          ),
        },
        {
          q: tr("Bagaimana menambah foto produk?", "How do I add a product photo?"),
          a: tr(
            "Saat menambah/mengedit produk, klik Unggah foto di bagian atas form. Foto otomatis dikompres agar ringan, dan tampil di daftar produk maupun toko online.",
            "When adding/editing a product, click Upload photo at the top of the form. Photos are auto-compressed and shown in your product list and online store."
          ),
        },
        {
          q: tr("Bagaimana membuat varian (mis. ukuran/warna)?", "How do I create variants (e.g. size/color)?"),
          a: tr(
            "Di form produk, klik Tambah varian. Tiap varian punya harga & stok sendiri, misalnya 'Reguler' dan 'Large'.",
            "In the product form, click Add variant. Each variant has its own price & stock, e.g. 'Regular' and 'Large'."
          ),
        },
        {
          q: tr("Apakah produk yang dihapus benar-benar hilang?", "Are deleted products really gone?"),
          a: tr(
            "Tidak. Produk dinonaktifkan agar riwayat transaksi lama tetap utuh, tapi tidak lagi muncul di katalog & kasir.",
            "No. Products are deactivated so past transaction history stays intact, but they no longer appear in the catalog & cashier."
          ),
        },
      ],
    },
    {
      title: tr("Penjualan & Pesanan", "Sales & Orders"),
      icon: ShoppingCart,
      items: [
        {
          q: tr("Bagaimana pelanggan memesan dari toko online?", "How do customers order from the online store?"),
          a: tr(
            "Bagikan Link Toko Publik (ada di Pengaturan). Pelanggan pilih produk, checkout, dan bayar otomatis (Midtrans) atau transfer manual. Pesanan masuk ke menu Pesanan untuk kamu konfirmasi.",
            "Share your Public Store Link (in Settings). Customers pick products, check out, and pay automatically (Midtrans) or via manual transfer. Orders appear in the Orders menu for you to confirm."
          ),
        },
        {
          q: tr("Apakah stok berkurang otomatis?", "Does stock decrease automatically?"),
          a: tr(
            "Ya. Setiap pesanan lunas mengurangi stok produk fisik dan tercatat di riwayat pergerakan stok.",
            "Yes. Each paid order reduces physical product stock and is logged in the stock movement history."
          ),
        },
      ],
    },
    {
      title: tr("Keuangan & Laporan", "Finance & Reports"),
      icon: Wallet,
      items: [
        {
          q: tr("Dari mana data Keuangan berasal?", "Where does Finance data come from?"),
          a: tr(
            "Penjualan tercatat otomatis sebagai pemasukan. Kamu juga bisa menambah pemasukan/pengeluaran manual lewat tombol Catat Transaksi. Pembayaran hutang/piutang juga masuk ke arus kas.",
            "Sales are recorded automatically as income. You can also add manual income/expenses via Record Transaction. Debt/receivable payments also flow into cash flow."
          ),
        },
        {
          q: tr("Bagaimana cara melihat & mengekspor laba?", "How do I view & export profit?"),
          a: tr(
            "Buka Laporan. Ada Laba/Rugi bulan ini (omzet − HPP − pengeluaran), produk terlaris, dan penjualan per channel. Bisa diekspor ke PDF, Excel, atau CSV.",
            "Open Reports. You'll see this month's P&L (revenue − COGS − expenses), best sellers, and sales per channel. Exportable to PDF, Excel, or CSV."
          ),
        },
        {
          q: tr("Apa itu Hutang & Piutang?", "What are Debts & Receivables?"),
          a: tr(
            "Piutang = pelanggan berhutang ke kamu; Hutang = kamu berhutang ke supplier. Catat di menu Hutang & Piutang, lalu rekam pembayaran cicilannya — otomatis tercatat di arus kas.",
            "Receivable = a customer owes you; Payable = you owe a supplier. Record them in the Debts & Receivables menu, then log installment payments — they're auto-recorded in cash flow."
          ),
        },
      ],
    },
    {
      title: tr("Akun & Pengaturan", "Account & Settings"),
      icon: Settings,
      items: [
        {
          q: tr("Bagaimana mengatur pajak (PPN)?", "How do I set up tax (VAT)?"),
          a: tr(
            "Buka Pengaturan → isi Pajak/PPN (%). Nilai ini otomatis dipakai menghitung pajak saat checkout.",
            "Open Settings → fill in Tax/VAT (%). This value is used automatically when calculating tax at checkout."
          ),
        },
        {
          q: tr("Bagaimana mengubah nama, foto, atau kata sandi saya?", "How do I change my name, photo, or password?"),
          a: tr(
            "Klik foto/inisialmu di kanan atas → Profil Saya. Di sana kamu bisa ubah nama, foto, dan kata sandi.",
            "Click your photo/initials at the top right → My Profile. There you can change your name, photo, and password."
          ),
        },
        {
          q: tr("Apakah saya bisa menambah akun kasir/staf?", "Can I add cashier/staff accounts?"),
          a: tr(
            "Bisa. Buka menu Staf (khusus Admin) untuk menambah akun Kasir atau Staf Gudang dengan hak akses berbeda.",
            "Yes. Open the Staff menu (Admin only) to add Cashier or Warehouse Staff accounts with different access rights."
          ),
        },
      ],
    },
  ];

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{tr("Bantuan & FAQ", "Help & FAQ")}</h1>
        <p className="text-sm text-zinc-500">
          {tr("Panduan singkat & jawaban pertanyaan umum.", "Quick guide & answers to common questions.")}
        </p>
      </div>

      {/* Quick start */}
      <div className="rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-zinc-900">{tr("Mulai cepat dalam 3 langkah 🚀", "Quick start in 3 steps 🚀")}</h2>
        <ol className="mt-3 space-y-2 text-sm text-zinc-700">
          <li className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-yellow-400">1</span>
            <Link href="/inventory" className="font-semibold underline-offset-2 hover:underline">
              {tr("Tambah produk", "Add products")}
            </Link>{" "}
            {tr("di Inventaris", "in Inventory")}
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-yellow-400">2</span>
            <Link href="/settings" className="font-semibold underline-offset-2 hover:underline">
              {tr("Bagikan link toko", "Share your store link")}
            </Link>{" "}
            {tr("ke pelanggan", "with customers")}
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-yellow-400">3</span>
            <Link href="/reports" className="font-semibold underline-offset-2 hover:underline">
              {tr("Pantau laporan", "Track reports")}
            </Link>{" "}
            {tr("& keuangan", "& finances")}
          </li>
        </ol>
      </div>

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="mb-2 flex items-center gap-2">
              <section.icon className="h-4 w-4 text-yellow-500" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">{section.title}</h2>
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
        <ShortcutCard href="/inventory" icon={PackagePlus} label={tr("Tambah Produk", "Add Product")} />
        <ShortcutCard href="/orders" icon={ShoppingCart} label={tr("Pesanan", "Orders")} />
        <ShortcutCard href="/customers" icon={Users} label={tr("Pelanggan", "Customers")} />
        <ShortcutCard href="/finance" icon={Wallet} label={tr("Keuangan", "Finance")} />
        <ShortcutCard href="/reports" icon={FileBarChart} label={tr("Laporan", "Reports")} />
        <ShortcutCard href="/settings" icon={Settings} label={tr("Pengaturan", "Settings")} />
      </div>
    </>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-zinc-900">{q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-600">{a}</div>}
    </div>
  );
}

function ShortcutCard({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
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
