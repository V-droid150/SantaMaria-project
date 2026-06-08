"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ProductType } from "@prisma/client";
import {
  ArrowLeft,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Loader2,
  CheckCircle2,
  PackageX,
} from "lucide-react";

export type PosProduct = {
  variantId: string;
  productName: string;
  variantName: string;
  category: string;
  type: ProductType;
  price: number;
  stock: number;
  image: string | null;
};

type CartLine = PosProduct & { quantity: number };

const PAYMENT_METHODS = [
  { value: "CASH", label: "Tunai" },
  { value: "QRIS", label: "QRIS" },
  { value: "BANK_TRANSFER", label: "Transfer" },
  { value: "EWALLET", label: "E-Wallet" },
] as const;

function rupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

const TAX_RATE = 11; // tampilan estimasi; nilai final dihitung server

export default function PosTerminal({
  products,
  cashierName,
}: {
  products: PosProduct[];
  cashierName: string;
}) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("Semua");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payment, setPayment] = useState<(typeof PAYMENT_METHODS)[number]["value"]>("CASH");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const categories = useMemo(
    () => ["Semua", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCat === "Semua" || p.category === activeCat;
      const matchQuery = `${p.productName} ${p.variantName}`
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [products, query, activeCat]);

  const subtotal = cart.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const tax = (subtotal * TAX_RATE) / 100;
  const total = subtotal + tax;

  function addToCart(p: PosProduct) {
    setCart((prev) => {
      const existing = prev.find((l) => l.variantId === p.variantId);
      if (existing) {
        // Jangan melebihi stok untuk produk fisik.
        if (p.type === "PHYSICAL" && existing.quantity >= p.stock) return prev;
        return prev.map((l) =>
          l.variantId === p.variantId ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { ...p, quantity: 1 }];
    });
  }

  function changeQty(variantId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.variantId !== variantId) return l;
          const next = l.quantity + delta;
          if (l.type === "PHYSICAL" && next > l.stock) return l;
          return { ...l, quantity: next };
        })
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(variantId: string) {
    setCart((prev) => prev.filter((l) => l.variantId !== variantId));
  }

  async function checkout() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setToast(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
          paymentMethod: payment,
          channel: "POS",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "err", msg: data.error ?? "Gagal memproses" });
        return;
      }
      setToast({ type: "ok", msg: `Transaksi berhasil · ${data.order.orderNumber}` });
      setCart([]);
    } catch {
      setToast({ type: "err", msg: "Kesalahan jaringan" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[#fafafa] text-zinc-900 lg:flex-row">
      {/* ---------- Kiri: katalog produk ---------- */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 sm:px-6">
          <Link
            href="/dashboard"
            className="rounded-lg p-2 text-zinc-700 transition hover:bg-zinc-100"
            aria-label="Kembali ke dasbor"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="mr-auto">
            <h1 className="text-lg font-bold">Kasir (POS)</h1>
            <p className="text-xs text-zinc-500">Kasir: {cashierName}</p>
          </div>
          <div className="relative w-44 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari produk..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-3 text-sm outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/40"
            />
          </div>
        </header>

        {/* Filter kategori */}
        <div className="flex gap-2 overflow-x-auto border-b border-zinc-200 bg-white px-4 py-2 sm:px-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                activeCat === cat
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid produk */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-400">
              <PackageX className="h-10 w-10" />
              <p className="text-sm">Tidak ada produk.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => {
                const soldOut = p.type === "PHYSICAL" && p.stock <= 0;
                return (
                  <button
                    key={p.variantId}
                    onClick={() => addToCart(p)}
                    disabled={soldOut}
                    className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 text-left transition hover:border-yellow-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="mb-3 flex h-16 w-full items-center justify-center overflow-hidden rounded-xl bg-yellow-400/10 text-2xl">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt={p.productName} className="h-full w-full object-cover" />
                      ) : (
                        "🛒"
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm font-semibold">{p.productName}</p>
                    <p className="text-xs text-zinc-400">{p.variantName}</p>
                    <p className="mt-2 text-sm font-bold text-zinc-900">{rupiah(p.price)}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-400">
                      {p.type === "PHYSICAL" ? `Stok: ${p.stock}` : "Digital"}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ---------- Kanan: keranjang ---------- */}
      <aside className="flex h-2/5 w-full flex-col border-t border-zinc-200 bg-white lg:h-auto lg:w-96 lg:border-l lg:border-t-0">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-4">
          <ShoppingCart className="h-5 w-5 text-yellow-500" />
          <h2 className="font-bold">Keranjang</h2>
          <span className="ml-auto rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-zinc-900">
            {cart.reduce((n, l) => n + l.quantity, 0)}
          </span>
        </div>

        {/* Daftar item */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {cart.length === 0 ? (
            <p className="mt-8 text-center text-sm text-zinc-400">Keranjang masih kosong</p>
          ) : (
            <ul className="space-y-1">
              {cart.map((l) => (
                <li key={l.variantId} className="rounded-xl p-2 hover:bg-zinc-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{l.productName}</p>
                      <p className="text-xs text-zinc-400">{l.variantName} · {rupiah(l.price)}</p>
                    </div>
                    <button
                      onClick={() => removeLine(l.variantId)}
                      className="rounded-md p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-500"
                      aria-label="Hapus item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => changeQty(l.variantId, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 transition hover:bg-zinc-100"
                        aria-label="Kurangi"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{l.quantity}</span>
                      <button
                        onClick={() => changeQty(l.variantId, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 transition hover:bg-zinc-100"
                        aria-label="Tambah"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-bold">{rupiah(l.price * l.quantity)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Ringkasan & checkout */}
        <div className="space-y-3 border-t border-zinc-200 p-4">
          {toast && (
            <div
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                toast.type === "ok"
                  ? "bg-yellow-400/15 text-yellow-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {toast.type === "ok" && <CheckCircle2 className="h-4 w-4" />}
              {toast.msg}
            </div>
          )}

          {/* Metode pembayaran */}
          <div className="grid grid-cols-4 gap-1.5">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setPayment(m.value)}
                className={`rounded-lg py-2 text-xs font-semibold transition ${
                  payment === m.value
                    ? "bg-yellow-400 text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-zinc-500">
              <span>Subtotal</span>
              <span>{rupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>Pajak ({TAX_RATE}%)</span>
              <span>{rupiah(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-dashed border-zinc-200 pt-2 text-base font-bold">
              <span>Total</span>
              <span className="text-zinc-900">{rupiah(total)}</span>
            </div>
          </div>

          <button
            onClick={checkout}
            disabled={cart.length === 0 || submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 py-3 text-sm font-bold text-zinc-900 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Memproses..." : "Bayar Sekarang"}
          </button>
        </div>
      </aside>
    </div>
  );
}
