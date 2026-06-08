"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  X,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Trash2,
  Lock,
} from "lucide-react";
import { rupiah, tanggal } from "@/lib/format";
import { useI18n } from "@/components/i18n/LanguageProvider";

export type CashFlowRow = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  category: string;
  description: string | null;
  occurredAt: string;
  fromOrder: boolean;
};

export default function FinanceClient({
  rows,
  monthIncome,
  monthExpense,
  balance,
}: {
  rows: CashFlowRow[];
  monthIncome: number;
  monthExpense: number;
  balance: number;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [modalOpen, setModalOpen] = useState(false);

  async function handleDelete(r: CashFlowRow) {
    if (r.fromOrder) return;
    if (!confirm(t("fin.confirmDelete"))) return;
    const res = await fetch(`/api/cashflows/${r.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? t("common.networkError"));
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("fin.title")}</h1>
          <p className="text-sm text-zinc-500">{t("fin.subtitle")}</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-yellow-300"
        >
          <Plus className="h-4 w-4" /> {t("fin.record")}
        </button>
      </div>

      {/* Ringkasan */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard icon={ArrowUpCircle} label={t("fin.incomeMonth")} value={rupiah(monthIncome)} accent />
        <SummaryCard icon={ArrowDownCircle} label={t("fin.expenseMonth")} value={rupiah(monthExpense)} />
        <SummaryCard icon={Wallet} label={t("fin.balance")} value={rupiah(balance)} dark />
      </section>

      {/* Daftar */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/15 text-yellow-500">
            <Wallet className="h-7 w-7" />
          </div>
          <div>
            <p className="font-semibold text-zinc-900">{t("fin.empty")}</p>
            <p className="mt-1 text-sm text-zinc-500">{t("fin.emptyDesc")}</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-semibold">{t("fin.colDate")}</th>
                  <th className="px-5 py-3 font-semibold">{t("fin.colCategory")}</th>
                  <th className="px-5 py-3 font-semibold">{t("fin.colDesc")}</th>
                  <th className="px-5 py-3 text-right font-semibold">{t("fin.colAmount")}</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((r) => (
                  <tr key={r.id} className="transition hover:bg-yellow-400/5">
                    <td className="px-5 py-4 text-zinc-500">{tanggal(r.occurredAt)}</td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-zinc-800">{r.category}</span>
                      {r.fromOrder && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                          <Lock className="h-2.5 w-2.5" /> {t("fin.auto")}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-zinc-500">{r.description ?? "—"}</td>
                    <td
                      className={`px-5 py-4 text-right font-bold ${
                        r.type === "INCOME" ? "text-yellow-600" : "text-zinc-900"
                      }`}
                    >
                      {r.type === "INCOME" ? "+" : "−"} {rupiah(r.amount)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {!r.fromOrder && (
                        <button
                          onClick={() => handleDelete(r)}
                          className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-500"
                          aria-label="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <CashFlowModal
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

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent = false,
  dark = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: boolean;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        dark ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white"
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          dark ? "bg-yellow-400 text-zinc-900" : accent ? "bg-yellow-400 text-zinc-900" : "bg-zinc-100 text-zinc-500"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className={`mt-4 text-sm ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function CashFlowModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const suggestions =
    type === "INCOME"
      ? ["Penjualan", "Modal", "Lainnya"]
      : ["Bahan Baku", "Gaji", "Sewa", "Listrik", "Operasional", "Lainnya"];

  async function save() {
    setError(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("Jumlah harus lebih dari 0");
    if (!category.trim()) return setError("Kategori wajib diisi");
    setSaving(true);
    try {
      const res = await fetch("/api/cashflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, amount: amt, category, description, occurredAt }),
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
          <h2 className="text-lg font-bold">{t("fin.record")}</h2>
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

          {/* Toggle tipe */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("INCOME")}
              className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                type === "INCOME"
                  ? "border-yellow-400 bg-yellow-400/10 text-zinc-900"
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
              }`}
            >
              {t("fin.income")}
            </button>
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                type === "EXPENSE"
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
              }`}
            >
              {t("fin.expense")}
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("fin.amount")}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("fin.category")}</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="cat-list"
              placeholder={t("fin.categoryPh")}
              className={inputCls}
            />
            <datalist id="cat-list">
              {suggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("fin.date")}</label>
            <input
              type="date"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("fin.note")}</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("fin.notePh")}
              className={inputCls}
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
