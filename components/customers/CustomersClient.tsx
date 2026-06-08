"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2, X, Loader2, Users, Phone, Mail } from "lucide-react";
import { rupiah, angka, getInitials } from "@/lib/format";
import { useI18n } from "@/components/i18n/LanguageProvider";

export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  points: number;
  orderCount: number;
  totalSpent: number;
};

export default function CustomersClient({ customers }: { customers: CustomerRow[] }) {
  const router = useRouter();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRow | null>(null);

  const filtered = useMemo(
    () =>
      customers.filter((c) =>
        `${c.name} ${c.phone ?? ""} ${c.email ?? ""}`.toLowerCase().includes(query.toLowerCase())
      ),
    [customers, query]
  );

  async function handleDelete(c: CustomerRow) {
    if (!confirm(t("cust.confirmDelete"))) return;
    const res = await fetch(`/api/customers/${c.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert(t("common.networkError"));
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("cust.title")}</h1>
          <p className="text-sm text-zinc-500">{t("cust.subtitle")}</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-yellow-300"
        >
          <Plus className="h-4 w-4" /> {t("cust.add")}
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("cust.searchPh")}
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/40"
        />
      </div>

      {customers.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/15 text-yellow-500">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <p className="font-semibold text-zinc-900">{t("cust.empty")}</p>
            <p className="mt-1 text-sm text-zinc-500">{t("cust.emptyDesc")}</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-semibold">{t("cust.colCustomer")}</th>
                  <th className="px-5 py-3 font-semibold">{t("cust.colContact")}</th>
                  <th className="px-5 py-3 font-semibold">{t("cust.colTx")}</th>
                  <th className="px-5 py-3 font-semibold">{t("cust.colSpent")}</th>
                  <th className="px-5 py-3 font-semibold">{t("cust.colPoints")}</th>
                  <th className="px-5 py-3 text-right font-semibold">{t("cust.colAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="transition hover:bg-yellow-400/5">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-yellow-400">
                          {getInitials(c.name)}
                        </div>
                        <span className="font-semibold text-zinc-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-500">
                      {c.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" /> {c.phone}
                        </span>
                      )}
                      {c.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" /> {c.email}
                        </span>
                      )}
                      {!c.phone && !c.email && "—"}
                    </td>
                    <td className="px-5 py-4 text-zinc-700">{angka(c.orderCount)}x</td>
                    <td className="px-5 py-4 font-semibold text-zinc-900">{rupiah(c.totalSpent)}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-yellow-400/15 px-2.5 py-1 text-xs font-semibold text-yellow-600">
                        {angka(c.points)} {t("cust.points")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditing(c);
                            setModalOpen(true);
                          }}
                          className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-500"
                          aria-label="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <CustomerModal
          customer={editing}
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

function CustomerModal({
  customer,
  onClose,
  onSaved,
}: {
  customer: CustomerRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const isEdit = !!customer;
  const [form, setForm] = useState({
    name: customer?.name ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    address: customer?.address ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    if (!form.name.trim()) return setError(t("cust.name"));
    setSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/customers/${customer!.id}` : "/api/customers", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

  const inputCls =
    "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/40";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-bold">{isEdit ? t("cust.modalEdit") : t("cust.modalAdd")}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("cust.name")}</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
              placeholder={t("cust.namePh")}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("cust.phone")}</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputCls}
              placeholder="08xx"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("cust.email")}</label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputCls}
              placeholder="email@contoh.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("cust.address")}</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
              className={inputCls}
              placeholder={t("cust.addressPh")}
            />
          </div>
        </div>

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
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
