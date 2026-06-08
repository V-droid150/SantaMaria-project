"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Store as StoreIcon } from "lucide-react";

export type StoreSettings = {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number;
  category: string;
  businessType: string;
};

export default function SettingsClient({ initial }: { initial: StoreSettings }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
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
      setError("Kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/40";

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-zinc-500">Kelola informasi toko & pajak.</p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-500">
            <StoreIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold">Profil Toko</h2>
            <p className="text-xs text-zinc-500">Tampil di struk & laporan.</p>
          </div>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Nama toko *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Telepon</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Email</label>
              <input value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Alamat</label>
            <textarea
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              rows={2}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Kategori bisnis</label>
              <input
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="contoh: Kuliner"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Pajak / PPN (%)</label>
              <input
                type="number"
                value={form.taxRate}
                onChange={(e) => set("taxRate", Number(e.target.value))}
                className={inputCls}
              />
              <p className="text-[11px] text-zinc-400">Dipakai otomatis menghitung pajak di kasir.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-zinc-900 transition hover:bg-yellow-300 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-yellow-600">
              <CheckCircle2 className="h-4 w-4" /> Tersimpan
            </span>
          )}
        </div>
      </div>
    </>
  );
}
