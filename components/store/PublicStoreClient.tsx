"use client";

import { useMemo, useState } from "react";
import {
  Store as StoreIcon,
  MapPin,
  Phone,
  Package,
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  PlayCircle,
} from "lucide-react";
import { rupiah } from "@/lib/format";

// Snap.js dimuat dinamis saat dibutuhkan.
declare global {
  interface Window {
    snap?: { pay: (token: string, opts: Record<string, () => void>) => void };
  }
}
let snapLoader: Promise<void> | null = null;
function loadSnap(url: string, clientKey: string): Promise<void> {
  if (typeof window !== "undefined" && window.snap) return Promise.resolve();
  if (snapLoader) return snapLoader;
  snapLoader = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = url;
    s.setAttribute("data-client-key", clientKey);
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Gagal memuat pembayaran"));
    document.body.appendChild(s);
  });
  return snapLoader;
}

export type PubVariant = { id: string; name: string; price: number; stock: number };
export type PubProduct = {
  id: string;
  name: string;
  category: string | null;
  image: string | null;
  video: string | null;
  type: "PHYSICAL" | "DIGITAL";
  variants: PubVariant[];
};
type StoreInfo = {
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  category: string | null;
};

export type PaymentInfo = {
  autoEnabled: boolean;
  manualEnabled: boolean;
  bank: string | null;
  account: string | null;
  accountName: string | null;
  qris: string | null;
};

// Kompres gambar bukti transfer sebelum dikirim (base64).
function compressImage(file: File, maxSize = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => reject(new Error("img"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });
}

type CartLine = {
  variantId: string;
  productName: string;
  variantName: string;
  price: number;
  qty: number;
  stock: number;
  type: "PHYSICAL" | "DIGITAL";
  image: string | null;
};

export default function PublicStoreClient({
  store,
  products,
  payment,
}: {
  store: StoreInfo;
  products: PubProduct[];
  payment: PaymentInfo;
}) {
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [selected, setSelected] = useState<PubProduct | null>(null);
  const [panel, setPanel] = useState<"cart" | "checkout" | "success" | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [payMethod, setPayMethod] = useState<"auto" | "manual">(
    payment.autoEnabled ? "auto" : "manual"
  );
  const [proof, setProof] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orderNumber: string; total: number; paid?: boolean } | null>(
    null
  );

  const lines = Object.values(cart);
  const itemCount = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);

  function addToCart(p: PubProduct, v: PubVariant, qty: number) {
    setCart((prev) => {
      const existing = prev[v.id];
      const nextQty = (existing?.qty ?? 0) + qty;
      const capped = p.type === "PHYSICAL" ? Math.min(nextQty, v.stock) : nextQty;
      return {
        ...prev,
        [v.id]: {
          variantId: v.id,
          productName: p.name,
          variantName: v.name,
          price: v.price,
          qty: capped,
          stock: v.stock,
          type: p.type,
          image: p.image,
        },
      };
    });
    setSelected(null);
  }

  function changeQty(variantId: string, delta: number) {
    setCart((prev) => {
      const l = prev[variantId];
      if (!l) return prev;
      const next = l.qty + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[variantId];
        return copy;
      }
      const capped = l.type === "PHYSICAL" ? Math.min(next, l.stock) : next;
      return { ...prev, [variantId]: { ...l, qty: capped } };
    });
  }

  async function placeOrder() {
    setError(null);
    if (!form.name.trim()) return setError("Nama pemesan wajib diisi");
    if (lines.length === 0) return setError("Keranjang kosong");
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: store.slug,
          items: lines.map((l) => ({ variantId: l.variantId, quantity: l.qty })),
          customer: { name: form.name, phone: form.phone, address: form.address },
          note: form.note,
          payMethod,
          proof: payMethod === "manual" ? proof : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat pesanan");
        return;
      }

      const finish = (paid: boolean) => {
        setSuccess({ orderNumber: data.orderNumber, total: data.total, paid });
        setCart({});
        setPanel("success");
      };

      // Jika pembayaran online aktif (Midtrans) -> buka popup Snap.
      if (data.snapToken && data.clientKey && data.snapUrl) {
        try {
          await loadSnap(data.snapUrl, data.clientKey);
          setSubmitting(false);
          window.snap?.pay(data.snapToken, {
            onSuccess: () => finish(true),
            onPending: () => finish(false),
            onError: () => setError("Pembayaran gagal. Silakan coba lagi."),
            onClose: () =>
              setError("Pembayaran dibatalkan. Pesananmu tersimpan sebagai belum dibayar."),
          });
          return;
        } catch {
          finish(false); // gagal muat Snap -> tampilkan sukses biasa
          return;
        }
      }

      finish(false);
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900">
      {/* Header toko */}
      <header className="bg-zinc-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-zinc-900">
              <StoreIcon className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold sm:text-3xl">{store.name}</h1>
              {store.category && (
                <span className="mt-1 inline-block rounded-full bg-yellow-400/20 px-2.5 py-0.5 text-xs font-semibold text-yellow-400">
                  {store.category}
                </span>
              )}
              <div className="mt-2 space-y-0.5 text-sm text-zinc-400">
                {store.address && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {store.address}
                  </p>
                )}
                {store.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {store.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Katalog */}
      <main className="mx-auto max-w-5xl px-4 py-8 pb-28 sm:px-6">
        <h2 className="mb-4 text-lg font-bold">Katalog Produk</h2>
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white py-20 text-center text-zinc-400">
            <Package className="h-10 w-10" />
            <p className="text-sm">Belum ada produk yang ditampilkan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => {
              const prices = p.variants.map((v) => v.price);
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
              const soldOut = p.type === "PHYSICAL" && totalStock <= 0;
              return (
                <button
                  key={p.id}
                  onClick={() => !soldOut && setSelected(p)}
                  disabled={soldOut}
                  className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left transition hover:border-yellow-400 hover:shadow-md disabled:opacity-60"
                >
                  <div className="relative flex aspect-square items-center justify-center bg-yellow-400/10 text-4xl">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      "🛍️"
                    )}
                    {soldOut && (
                      <span className="absolute right-2 top-2 rounded-full bg-zinc-900/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Stok habis
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="line-clamp-2 text-sm font-semibold">{p.name}</p>
                    {p.category && <p className="text-xs text-zinc-400">{p.category}</p>}
                    <p className="mt-auto pt-2 text-sm font-bold text-zinc-900">
                      {min === max ? rupiah(min) : `${rupiah(min)} – ${rupiah(max)}`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Tombol keranjang mengambang */}
      {itemCount > 0 && panel === null && (
        <button
          onClick={() => setPanel("cart")}
          className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-zinc-900 py-3 pl-5 pr-4 text-sm font-semibold text-white shadow-xl transition hover:bg-zinc-800"
        >
          <ShoppingCart className="h-5 w-5 text-yellow-400" />
          {itemCount} item · {rupiah(subtotal)}
          <span className="rounded-full bg-yellow-400 px-3 py-1 text-zinc-900">Lihat</span>
        </button>
      )}

      {/* Modal pilih produk */}
      {selected && (
        <ProductModal product={selected} onClose={() => setSelected(null)} onAdd={addToCart} />
      )}

      {/* Panel keranjang / checkout / sukses */}
      {panel && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
          <div className="flex h-full w-full max-w-md flex-col bg-white">
            {/* Header panel */}
            <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-4">
              {panel === "checkout" && (
                <button onClick={() => setPanel("cart")} className="rounded-lg p-1.5 hover:bg-zinc-100">
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <h2 className="font-bold">
                {panel === "cart" ? "Keranjang" : panel === "checkout" ? "Checkout" : "Pesanan Diterima"}
              </h2>
              <button
                onClick={() => setPanel(null)}
                className="ml-auto rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Isi panel */}
            {panel === "cart" && (
              <CartView
                lines={lines}
                subtotal={subtotal}
                onChangeQty={changeQty}
                onCheckout={() => setPanel("checkout")}
              />
            )}

            {panel === "checkout" && (
              <CheckoutView
                lines={lines}
                subtotal={subtotal}
                form={form}
                setForm={setForm}
                payment={payment}
                payMethod={payMethod}
                setPayMethod={setPayMethod}
                proof={proof}
                setProof={setProof}
                error={error}
                submitting={submitting}
                onSubmit={placeOrder}
              />
            )}

            {panel === "success" && success && (
              <SuccessView
                orderNumber={success.orderNumber}
                total={success.total}
                paid={success.paid}
                storePhone={store.phone}
                onClose={() => setPanel(null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Modal pilih varian + qty ---------- */
function ProductModal({
  product,
  onClose,
  onAdd,
}: {
  product: PubProduct;
  onClose: () => void;
  onAdd: (p: PubProduct, v: PubVariant, qty: number) => void;
}) {
  const [variant, setVariant] = useState<PubVariant>(product.variants[0]);
  const [qty, setQty] = useState(1);
  const maxQty = product.type === "PHYSICAL" ? Math.max(variant.stock, 0) : 99;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="relative flex aspect-video items-center justify-center bg-yellow-400/10 text-5xl">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            "🛍️"
          )}
          <button
            onClick={onClose}
            className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-zinc-700 shadow"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <h3 className="text-lg font-bold">{product.name}</h3>
            {product.category && <p className="text-xs text-zinc-400">{product.category}</p>}
            <p className="mt-1 text-xl font-bold text-zinc-900">{rupiah(variant.price)}</p>
            {product.video &&
              (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(product.video) ? (
                <video
                  controls
                  src={product.video}
                  className="mt-3 w-full rounded-xl border border-zinc-200"
                />
              ) : (
                <a
                  href={product.video}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-700 hover:text-zinc-900"
                >
                  <PlayCircle className="h-4 w-4 text-yellow-500" /> Tonton Video
                </a>
              ))}
          </div>

          {product.variants.length > 1 && (
            <div>
              <p className="mb-1.5 text-sm font-medium text-zinc-700">Pilih varian</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setVariant(v);
                      setQty(1);
                    }}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      variant.id === v.id
                        ? "border-yellow-400 bg-yellow-400/10 text-zinc-900"
                        : "border-zinc-200 text-zinc-600"
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">
              {product.type === "PHYSICAL" ? `Stok: ${variant.stock}` : "Produk digital"}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center font-semibold">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            onClick={() => onAdd(product, variant, qty)}
            disabled={maxQty <= 0}
            className="w-full rounded-xl bg-yellow-400 py-3 text-sm font-bold text-zinc-900 transition hover:bg-yellow-300 disabled:opacity-50"
          >
            Tambah ke Keranjang · {rupiah(variant.price * qty)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Isi keranjang ---------- */
function CartView({
  lines,
  subtotal,
  onChangeQty,
  onCheckout,
}: {
  lines: CartLine[];
  subtotal: number;
  onChangeQty: (id: string, d: number) => void;
  onCheckout: () => void;
}) {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        {lines.length === 0 ? (
          <p className="mt-10 text-center text-sm text-zinc-400">Keranjang kosong</p>
        ) : (
          <ul className="space-y-3">
            {lines.map((l) => (
              <li key={l.variantId} className="flex gap-3 rounded-xl border border-zinc-100 p-2">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-yellow-400/10 text-xl">
                  {l.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.image} alt={l.productName} className="h-full w-full object-cover" />
                  ) : (
                    "🛍️"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{l.productName}</p>
                  {l.variantName !== "Default" && (
                    <p className="text-xs text-zinc-400">{l.variantName}</p>
                  )}
                  <p className="text-sm font-bold text-zinc-900">{rupiah(l.price * l.qty)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onChangeQty(l.variantId, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200"
                  >
                    {l.qty === 1 ? <Trash2 className="h-3.5 w-3.5 text-red-500" /> : <Minus className="h-3.5 w-3.5" />}
                  </button>
                  <span className="w-5 text-center text-sm font-semibold">{l.qty}</span>
                  <button
                    onClick={() => onChangeQty(l.variantId, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {lines.length > 0 && (
        <div className="border-t border-zinc-200 p-4">
          <div className="mb-3 flex justify-between text-sm">
            <span className="text-zinc-500">Subtotal</span>
            <span className="font-bold">{rupiah(subtotal)}</span>
          </div>
          <button
            onClick={onCheckout}
            className="w-full rounded-xl bg-yellow-400 py-3 text-sm font-bold text-zinc-900 transition hover:bg-yellow-300"
          >
            Lanjut ke Checkout
          </button>
        </div>
      )}
    </>
  );
}

/* ---------- Form checkout ---------- */
function CheckoutView({
  lines,
  subtotal,
  form,
  setForm,
  payment,
  payMethod,
  setPayMethod,
  proof,
  setProof,
  error,
  submitting,
  onSubmit,
}: {
  lines: CartLine[];
  subtotal: number;
  form: { name: string; phone: string; address: string; note: string };
  setForm: (f: { name: string; phone: string; address: string; note: string }) => void;
  payment: PaymentInfo;
  payMethod: "auto" | "manual";
  setPayMethod: (m: "auto" | "manual") => void;
  proof: string | null;
  setProof: (p: string | null) => void;
  error: string | null;
  submitting: boolean;
  onSubmit: () => void;
}) {
  async function onProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    try {
      setProof(await compressImage(file));
    } catch {
      /* abaikan */
    }
  }
  const inputCls =
    "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/40";
  return (
    <>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Nama *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nama kamu"
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">No. WhatsApp / Telepon</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="08xx (agar penjual bisa menghubungi)"
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Alamat (opsional)</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            rows={2}
            placeholder="Alamat pengiriman..."
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Catatan (opsional)</label>
          <input
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="mis. tanpa gula, warna merah..."
            className={inputCls}
          />
        </div>

        {/* Metode pembayaran */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700">Metode pembayaran</label>
          {payment.autoEnabled && payment.manualEnabled && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPayMethod("auto")}
                className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                  payMethod === "auto"
                    ? "border-yellow-400 bg-yellow-400/10 text-zinc-900"
                    : "border-zinc-200 text-zinc-500"
                }`}
              >
                Bayar Otomatis
              </button>
              <button
                type="button"
                onClick={() => setPayMethod("manual")}
                className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                  payMethod === "manual"
                    ? "border-yellow-400 bg-yellow-400/10 text-zinc-900"
                    : "border-zinc-200 text-zinc-500"
                }`}
              >
                Transfer Manual
              </button>
            </div>
          )}
          {payMethod === "auto" && (
            <p className="text-xs text-zinc-500">
              Bayar via QRIS / VA / e-wallet / kartu lewat popup pembayaran.
            </p>
          )}
          {payMethod === "manual" && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 text-sm">
              {payment.manualEnabled ? (
                <>
                  <p className="font-semibold text-zinc-800">Transfer ke:</p>
                  {payment.bank && (
                    <p className="text-zinc-600">
                      {payment.bank}
                      {payment.account ? ` · ${payment.account}` : ""}
                    </p>
                  )}
                  {payment.accountName && <p className="text-zinc-600">a.n. {payment.accountName}</p>}
                  {payment.qris && (
                    <div className="mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={payment.qris} alt="QRIS" className="h-40 w-40 rounded-lg border border-zinc-200 object-contain" />
                    </div>
                  )}
                  <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:border-yellow-400">
                    📎 {proof ? "Ganti bukti transfer" : "Unggah bukti transfer (opsional)"}
                    <input type="file" accept="image/*" onChange={onProof} className="hidden" />
                  </label>
                  {proof && <p className="mt-1 text-[11px] text-yellow-600">Bukti terlampir ✓</p>}
                </>
              ) : (
                <p className="text-zinc-500">
                  Penjual akan menghubungimu untuk pembayaran setelah pesanan dibuat.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Ringkasan */}
        <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Pesananmu</p>
          <ul className="space-y-1 text-sm">
            {lines.map((l) => (
              <li key={l.variantId} className="flex justify-between">
                <span className="text-zinc-600">
                  {l.qty}× {l.productName}
                  {l.variantName !== "Default" ? ` (${l.variantName})` : ""}
                </span>
                <span>{rupiah(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-dashed border-zinc-200 pt-2 text-sm font-bold">
            <span>Subtotal</span>
            <span>{rupiah(subtotal)}</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">Pajak (bila ada) & total final ditampilkan setelah pesanan dibuat.</p>
        </div>
      </div>

      <div className="border-t border-zinc-200 p-4">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 py-3 text-sm font-bold text-zinc-900 transition hover:bg-yellow-300 disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Pesan Sekarang
        </button>
      </div>
    </>
  );
}

/* ---------- Sukses ---------- */
function SuccessView({
  orderNumber,
  total,
  paid,
  storePhone,
  onClose,
}: {
  orderNumber: string;
  total: number;
  paid?: boolean;
  storePhone: string | null;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-zinc-900">
        <CheckCircle2 className="h-9 w-9" />
      </div>
      <h3 className="mt-4 text-lg font-bold">
        {paid ? "Pembayaran berhasil! 🎉" : "Pesanan berhasil dibuat! 🎉"}
      </h3>
      <p className="mt-1 text-sm text-zinc-500">No. Pesanan</p>
      <p className="text-lg font-bold text-zinc-900">{orderNumber}</p>
      <p className="mt-3 text-sm text-zinc-600">
        Total: <span className="font-bold">{rupiah(total)}</span>
      </p>
      <p className="mt-4 max-w-xs text-sm text-zinc-500">
        {paid
          ? "Pembayaran diterima. Penjual akan segera memproses pesananmu."
          : `Pesananmu tersimpan. Penjual akan segera memproses${
              storePhone ? " dan menghubungimu" : ""
            }.`}
      </p>
      <button
        onClick={onClose}
        className="mt-6 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
      >
        Kembali ke Katalog
      </button>
    </div>
  );
}
