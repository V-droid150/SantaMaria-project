"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  Store as StoreIcon,
  Link2,
  Copy,
  ExternalLink,
  CreditCard,
  ImagePlus,
} from "lucide-react";
import { useI18n } from "@/components/i18n/LanguageProvider";

// Kompres gambar QRIS sebelum disimpan (base64).
function compressImage(file: File, maxSize = 600): Promise<string> {
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
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("img"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });
}

export type StoreSettings = {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number;
  category: string;
  businessType: string;
  payoutBank: string;
  payoutBankCode: string;
  payoutAccount: string;
  payoutName: string;
  qrisImageUrl: string | null;
};

export default function SettingsClient({
  initial,
  slug,
}: {
  initial: StoreSettings;
  slug: string | null;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl =
    slug && typeof window !== "undefined" ? `${window.location.origin}/toko/${slug}` : null;

  async function copyLink() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* abaikan */
    }
  }

  function set<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleQris(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError(t("common.errImage"));
    try {
      set("qrisImageUrl", await compressImage(file));
    } catch {
      setError("Gagal memproses gambar QRIS");
    }
  }

  async function save() {
    setError(null);
    if (!form.name.trim()) return setError("Nama toko wajib diisi");
    setSaving(true);
    try {
      const res = await fetch("/api/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, taxRate: Number(form.taxRate) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError(t("common.networkError"));
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/40";

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("set.title")}</h1>
        <p className="text-sm text-zinc-500">{t("set.subtitle")}</p>
      </div>

      {/* Link toko publik */}
      <div className="max-w-2xl rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-500">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold">{t("set.publicLink")}</h2>
            <p className="text-xs text-zinc-500">{t("set.publicLinkDesc")}</p>
          </div>
        </div>

        {publicUrl ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              readOnly
              value={publicUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700 outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-yellow-300"
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? t("set.copied") : t("set.copy")}
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-yellow-400"
              >
                <ExternalLink className="h-4 w-4" /> {t("set.openLink")}
              </a>
            </div>
          </div>
        ) : (
          <p className="rounded-xl bg-zinc-100 px-3 py-2.5 text-sm text-zinc-500">{t("set.noLink")}</p>
        )}
      </div>

      <div className="max-w-2xl rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-500">
            <StoreIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold">{t("set.storeProfile")}</h2>
            <p className="text-xs text-zinc-500">{t("set.storeProfileDesc")}</p>
          </div>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("set.storeName")}</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">{t("set.phone")}</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">{t("set.email")}</label>
              <input value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("set.address")}</label>
            <textarea
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              rows={2}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">{t("set.category")}</label>
              <input
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder={t("set.categoryPh")}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">{t("set.tax")}</label>
              <input
                type="number"
                value={form.taxRate}
                onChange={(e) => set("taxRate", Number(e.target.value))}
                className={inputCls}
              />
              <p className="text-[11px] text-zinc-400">{t("set.taxHint")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pengaturan pembayaran (rekening penjual) */}
      <div className="max-w-2xl rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-500">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold">{t("set.payTitle")}</h2>
            <p className="text-xs text-zinc-500">{t("set.payDesc")}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">{t("set.payBank")}</label>
              <input
                value={form.payoutBank}
                onChange={(e) => set("payoutBank", e.target.value)}
                placeholder={t("set.payBankPh")}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">{t("set.payName")}</label>
              <input
                value={form.payoutName}
                onChange={(e) => set("payoutName", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">{t("set.payAccount")}</label>
              <input
                value={form.payoutAccount}
                onChange={(e) => set("payoutAccount", e.target.value)}
                placeholder={t("set.payAccountPh")}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">{t("set.payBankCode")}</label>
              <input
                value={form.payoutBankCode}
                onChange={(e) => set("payoutBankCode", e.target.value)}
                placeholder={t("set.payBankCodePh")}
                className={inputCls}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("set.qris")}</label>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                {form.qrisImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.qrisImageUrl} alt="QRIS" className="h-full w-full object-contain" />
                ) : (
                  <ImagePlus className="h-6 w-6 text-zinc-300" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-yellow-400">
                  <ImagePlus className="h-4 w-4" /> {t("set.qrisUpload")}
                  <input type="file" accept="image/*" onChange={handleQris} className="hidden" />
                </label>
                {form.qrisImageUrl && (
                  <button
                    type="button"
                    onClick={() => set("qrisImageUrl", null)}
                    className="text-left text-xs font-medium text-red-500 hover:underline"
                  >
                    {t("set.qrisRemove")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tombol simpan (mencakup profil & pembayaran) */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-zinc-900 transition hover:bg-yellow-300 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("set.save")}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-yellow-600">
            <CheckCircle2 className="h-4 w-4" /> {t("common.saved")}
          </span>
        )}
      </div>
    </>
  );
}
