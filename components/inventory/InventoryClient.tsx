"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  Boxes,
  AlertTriangle,
  ImagePlus,
  Package,
  ClipboardCheck,
} from "lucide-react";
import { rupiah } from "@/lib/format";
import { useI18n } from "@/components/i18n/LanguageProvider";

// Hanya simpan digit, tampilkan dengan pemisah ribuan (300000 -> "300.000").
function formatThousands(digits: string): string {
  const clean = digits.replace(/\D/g, "");
  if (!clean) return "";
  return Number(clean).toLocaleString("id-ID");
}
function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

// Kompres & ubah ukuran foto di browser sebelum disimpan (hemat ukuran).
function compressImage(file: File, maxSize = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas tidak didukung"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => reject(new Error("Gagal memuat gambar"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

export type InvVariant = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  costPrice: number;
  stock: number;
  reorderPoint: number;
};
export type InvProduct = {
  id: string;
  name: string;
  description: string | null;
  type: "PHYSICAL" | "DIGITAL";
  image: string | null;
  video: string | null;
  category: string | null;
  variants: InvVariant[];
};

type FormVariant = {
  id?: string;
  name: string;
  sku: string;
  price: string;
  costPrice: string;
  stock: string;
  reorderPoint: string;
};

const emptyVariant = (): FormVariant => ({
  name: "Default",
  sku: "",
  price: "",
  costPrice: "",
  stock: "",
  reorderPoint: "",
});

export default function InventoryClient({
  products,
  categories,
}: {
  products: InvProduct[];
  categories: string[];
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<InvProduct | null>(null);

  const filtered = useMemo(
    () =>
      products.filter((p) =>
        `${p.name} ${p.category ?? ""}`.toLowerCase().includes(query.toLowerCase())
      ),
    [products, query]
  );

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(p: InvProduct) {
    setEditing(p);
    setModalOpen(true);
  }

  async function handleDelete(p: InvProduct) {
    if (!confirm(t("inv.confirmDelete"))) return;
    const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert(t("common.networkError"));
  }

  const totalStock = (p: InvProduct) =>
    p.type === "DIGITAL" ? null : p.variants.reduce((s, v) => s + v.stock, 0);
  const priceLabel = (p: InvProduct) => {
    const prices = p.variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? rupiah(min) : `${rupiah(min)} – ${rupiah(max)}`;
  };
  const isLow = (p: InvProduct) =>
    p.type === "PHYSICAL" && p.variants.some((v) => v.stock <= v.reorderPoint);

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("inv.title")}</h1>
          <p className="text-sm text-zinc-500">{t("inv.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/opname"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-yellow-400 hover:text-zinc-900"
          >
            <ClipboardCheck className="h-4 w-4" /> {t("inv.opname")}
          </Link>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-yellow-300"
          >
            <Plus className="h-4 w-4" /> {t("inv.addProduct")}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("inv.searchPh")}
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/40"
        />
      </div>

      {/* List */}
      {products.length === 0 ? (
        <EmptyState onAdd={openCreate} />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white py-16 text-center text-sm text-zinc-400">
          {t("inv.noMatch")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-semibold">{t("inv.colProduct")}</th>
                  <th className="px-5 py-3 font-semibold">{t("inv.colCategory")}</th>
                  <th className="px-5 py-3 font-semibold">{t("inv.colType")}</th>
                  <th className="px-5 py-3 font-semibold">{t("inv.colPrice")}</th>
                  <th className="px-5 py-3 font-semibold">{t("inv.colStock")}</th>
                  <th className="px-5 py-3 text-right font-semibold">{t("inv.colAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((p) => {
                  const stock = totalStock(p);
                  return (
                    <tr key={p.id} className="transition hover:bg-yellow-400/5">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-10 w-10 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-300">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-900">{p.name}</p>
                            <p className="text-xs text-zinc-400">
                              {p.variants.length} {t("inv.variant")}
                              {p.variants.length === 1 && p.variants[0].name === "Default"
                                ? ""
                                : ` · ${p.variants.map((v) => v.name).join(", ")}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-zinc-500">{p.category ?? "—"}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            p.type === "PHYSICAL"
                              ? "bg-zinc-100 text-zinc-600"
                              : "bg-yellow-400/15 text-yellow-600"
                          }`}
                        >
                          {p.type === "PHYSICAL" ? t("inv.physical") : t("inv.digital")}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-zinc-900">{priceLabel(p)}</td>
                      <td className="px-5 py-4">
                        {stock === null ? (
                          <span className="text-zinc-400">∞</span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 font-medium ${
                              isLow(p) ? "text-yellow-600" : "text-zinc-700"
                            }`}
                          >
                            {isLow(p) && <AlertTriangle className="h-3.5 w-3.5" />}
                            {stock}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-500"
                            aria-label="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <ProductModal
          product={editing}
          categories={categories}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/15 text-yellow-500">
        <Boxes className="h-7 w-7" />
      </div>
      <div>
        <p className="font-semibold text-zinc-900">{t("inv.empty")}</p>
        <p className="mt-1 text-sm text-zinc-500">{t("inv.emptyDesc")}</p>
      </div>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-yellow-300"
      >
        <Plus className="h-4 w-4" /> {t("inv.addProduct")}
      </button>
    </div>
  );
}

/* ---------------- Modal Tambah/Edit Produk ---------------- */

function ProductModal({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: InvProduct | null;
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const isEdit = !!product;
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [type, setType] = useState<"PHYSICAL" | "DIGITAL">(product?.type ?? "PHYSICAL");
  const [variants, setVariants] = useState<FormVariant[]>(
    product
      ? product.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku ?? "",
          price: String(v.price),
          costPrice: String(v.costPrice),
          stock: String(v.stock),
          reorderPoint: String(v.reorderPoint),
        }))
      : [emptyVariant()]
  );
  const [image, setImage] = useState<string | null>(product?.image ?? null);
  const [video, setVideo] = useState(product?.video ?? "");
  const [imgLoading, setImgLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function setVariant(i: number, patch: Partial<FormVariant>) {
    setVariants((vs) => vs.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // izinkan pilih file sama lagi
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("File harus berupa gambar");
    setError(null);
    setImgLoading(true);
    try {
      setImage(await compressImage(file));
    } catch {
      setError("Gagal memproses foto");
    } finally {
      setImgLoading(false);
    }
  }

  async function save() {
    setError(null);
    if (!name.trim()) return setError("Nama produk wajib diisi");
    const parsed = variants.map((v) => ({
      id: v.id,
      name: v.name.trim() || "Default",
      sku: v.sku.trim(),
      price: Number(v.price || 0),
      costPrice: Number(v.costPrice || 0),
      stock: Number(v.stock || 0),
      reorderPoint: Number(v.reorderPoint || 0),
    }));
    if (parsed.some((v) => !(v.price >= 0) || Number.isNaN(v.price))) {
      return setError("Harga varian harus berupa angka");
    }

    setSaving(true);
    try {
      const url = isEdit ? `/api/products/${product!.id}` : "/api/products";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          type,
          categoryName: category,
          image,
          videoUrl: video,
          variants: parsed,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan");
        return;
      }
      onSaved();
    } catch {
      setError("Kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl bg-white sm:rounded-2xl">
        {/* Header modal */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-bold">{isEdit ? t("inv.modalEdit") : t("inv.modalAdd")}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Foto produk */}
          <Field label={t("inv.photo")}>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                {imgLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                ) : image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-6 w-6 text-zinc-300" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-yellow-400">
                  <ImagePlus className="h-4 w-4" />
                  {image ? t("inv.changePhoto") : t("inv.uploadPhoto")}
                  <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                </label>
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="text-left text-xs font-medium text-red-500 hover:underline"
                  >
                    {t("inv.removePhoto")}
                  </button>
                )}
                <p className="text-[11px] text-zinc-400">{t("inv.photoHint")}</p>
              </div>
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("inv.name")}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("inv.namePh")}
                className={inputCls}
              />
            </Field>
            <Field label={t("inv.category")}>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={t("inv.categoryPh")}
                list="kategori-list"
                className={inputCls}
              />
              <datalist id="kategori-list">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
          </div>

          <Field label={t("inv.productType")}>
            <div className="flex gap-2">
              {(["PHYSICAL", "DIGITAL"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setType(opt)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${
                    type === opt
                      ? "border-yellow-400 bg-yellow-400/10 text-zinc-900"
                      : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
                  }`}
                >
                  {opt === "PHYSICAL" ? t("inv.physicalLong") : t("inv.digitalLong")}
                </button>
              ))}
            </div>
          </Field>

          <Field label={t("inv.desc")}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder={t("inv.descPh")}
              className={inputCls}
            />
          </Field>

          <Field label={t("inv.video")}>
            <input
              type="url"
              value={video}
              onChange={(e) => setVideo(e.target.value)}
              placeholder={t("inv.videoPh")}
              className={inputCls}
            />
            <p className="text-[11px] text-zinc-400">{t("inv.videoHint")}</p>
          </Field>

          {/* Varian */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-700">{t("inv.variantsPrice")}</label>
              <button
                type="button"
                onClick={() => setVariants((vs) => [...vs, emptyVariant()])}
                className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900"
              >
                <Plus className="h-3.5 w-3.5" /> {t("inv.addVariant")}
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v, i) => (
                <div key={i} className="rounded-xl border border-zinc-200 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      value={v.name}
                      onChange={(e) => setVariant(i, { name: e.target.value })}
                      placeholder={t("inv.variantNamePh")}
                      className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-yellow-400"
                    />
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setVariants((vs) => vs.filter((_, idx) => idx !== i))}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500"
                        aria-label="Hapus varian"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <MiniField label={t("inv.priceSell")}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatThousands(v.price)}
                        onChange={(e) => setVariant(i, { price: onlyDigits(e.target.value) })}
                        placeholder="0"
                        className={miniInputCls}
                      />
                    </MiniField>
                    <MiniField label={t("inv.priceCost")}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatThousands(v.costPrice)}
                        onChange={(e) => setVariant(i, { costPrice: onlyDigits(e.target.value) })}
                        placeholder="0"
                        className={miniInputCls}
                      />
                    </MiniField>
                    <MiniField label={t("inv.stock")}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={v.stock}
                        onChange={(e) => setVariant(i, { stock: onlyDigits(e.target.value) })}
                        disabled={type === "DIGITAL"}
                        placeholder="0"
                        className={`${miniInputCls} disabled:bg-zinc-100 disabled:text-zinc-400`}
                      />
                    </MiniField>
                    <MiniField label={t("inv.stockMin")}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={v.reorderPoint}
                        onChange={(e) => setVariant(i, { reorderPoint: onlyDigits(e.target.value) })}
                        disabled={type === "DIGITAL"}
                        placeholder="0"
                        className={`${miniInputCls} disabled:bg-zinc-100 disabled:text-zinc-400`}
                      />
                    </MiniField>
                  </div>
                  <input
                    value={v.sku}
                    onChange={(e) => setVariant(i, { sku: e.target.value })}
                    placeholder={t("inv.skuPh")}
                    className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-yellow-400"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-zinc-900 transition hover:bg-yellow-300 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? t("inv.saveChanges") : t("inv.saveProduct")}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/40";
const miniInputCls =
  "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-sm outline-none focus:border-yellow-400";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-700">{label}</label>
      {children}
    </div>
  );
}
function MiniField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-zinc-500">{label}</label>
      {children}
    </div>
  );
}
