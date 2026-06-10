"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  X,
  Loader2,
  Trash2,
  HandCoins,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarClock,
  Lock,
} from "lucide-react";
import { rupiah, tanggal } from "@/lib/format";
import { useI18n } from "@/components/i18n/LanguageProvider";

type DebtType = "RECEIVABLE" | "PAYABLE";
type DebtStatus = "OPEN" | "PARTIAL" | "PAID" | "OVERDUE";

export type DebtRow = {
  id: string;
  type: DebtType;
  status: DebtStatus;
  amount: number;
  paidAmount: number;
  partyName: string;
  dueDate: string | null;
  note: string | null;
  fromOrder: boolean;
};

function formatThousands(digits: string): string {
  const clean = digits.replace(/\D/g, "");
  if (!clean) return "";
  return Number(clean).toLocaleString("id-ID");
}
function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

export default function DebtsClient({
  rows,
  totalReceivable,
  totalPayable,
  customerNames,
  supplierNames,
}: {
  rows: DebtRow[];
  totalReceivable: number;
  totalPayable: number;
  customerNames: string[];
  supplierNames: string[];
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [tab, setTab] = useState<DebtType>("RECEIVABLE");
  const [addOpen, setAddOpen] = useState(false);
  const [paying, setPaying] = useState<DebtRow | null>(null);

  const list = useMemo(() => rows.filter((r) => r.type === tab), [rows, tab]);

  async function handleDelete(r: DebtRow) {
    if (!confirm(t("debt.confirmDelete"))) return;
    const res = await fetch(`/api/debts/${r.id}`, { method: "DELETE" });
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
          <h1 className="text-2xl font-bold tracking-tight">{t("debt.title")}</h1>
          <p className="text-sm text-zinc-500">{t("debt.subtitle")}</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-yellow-300"
        >
          <Plus className="h-4 w-4" /> {t("debt.add")}
        </button>
      </div>

      {/* Ringkasan */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard
          icon={ArrowUpCircle}
          label={t("debt.totalReceivable")}
          value={rupiah(totalReceivable)}
          accent
        />
        <SummaryCard icon={ArrowDownCircle} label={t("debt.totalPayable")} value={rupiah(totalPayable)} dark />
      </section>

      {/* Tab */}
      <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1">
        {(["RECEIVABLE", "PAYABLE"] as const).map((tp) => (
          <button
            key={tp}
            onClick={() => setTab(tp)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === tp ? "bg-yellow-400 text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {tp === "RECEIVABLE" ? t("debt.tabReceivable") : t("debt.tabPayable")}
          </button>
        ))}
      </div>

      {/* Daftar */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/15 text-yellow-500">
            <HandCoins className="h-7 w-7" />
          </div>
          <div>
            <p className="font-semibold text-zinc-900">{t("debt.empty")}</p>
            <p className="mt-1 text-sm text-zinc-500">{t("debt.emptyDesc")}</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-semibold">{t("debt.colParty")}</th>
                  <th className="px-5 py-3 text-right font-semibold">{t("debt.colTotal")}</th>
                  <th className="px-5 py-3 text-right font-semibold">{t("debt.colRemaining")}</th>
                  <th className="px-5 py-3 font-semibold">{t("debt.colDue")}</th>
                  <th className="px-5 py-3 font-semibold">{t("debt.colStatus")}</th>
                  <th className="px-5 py-3 text-right font-semibold">{t("debt.colAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {list.map((r) => {
                  const remaining = r.amount - r.paidAmount;
                  const overdue =
                    r.status !== "PAID" && r.dueDate !== null && new Date(r.dueDate) < new Date();
                  return (
                    <tr key={r.id} className="transition hover:bg-yellow-400/5">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900">{r.partyName}</span>
                          {r.fromOrder && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                              <Lock className="h-2.5 w-2.5" /> {t("debt.fromOrder")}
                            </span>
                          )}
                        </div>
                        {r.note && <p className="text-xs text-zinc-400">{r.note}</p>}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-zinc-900">{rupiah(r.amount)}</td>
                      <td className="px-5 py-4 text-right font-bold text-zinc-900">
                        {r.status === "PAID" ? "—" : rupiah(remaining)}
                      </td>
                      <td className="px-5 py-4">
                        {r.dueDate ? (
                          <span
                            className={`inline-flex items-center gap-1 ${
                              overdue ? "font-semibold text-red-500" : "text-zinc-500"
                            }`}
                          >
                            {overdue && <CalendarClock className="h-3.5 w-3.5" />}
                            {tanggal(r.dueDate)}
                          </span>
                        ) : (
                          <span className="text-zinc-400">{t("debt.noDue")}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={r.status} t={t} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {r.status !== "PAID" && (
                            <button
                              onClick={() => setPaying(r)}
                              className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-yellow-400 hover:text-zinc-900"
                            >
                              {t("debt.pay")}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(r)}
                            className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-500"
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

      {addOpen && (
        <AddDebtModal
          defaultType={tab}
          customerNames={customerNames}
          supplierNames={supplierNames}
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setAddOpen(false);
            router.refresh();
          }}
        />
      )}

      {paying && (
        <PayModal
          debt={paying}
          onClose={() => setPaying(null)}
          onSaved={() => {
            setPaying(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function StatusBadge({ status, t }: { status: DebtStatus; t: (k: string) => string }) {
  const map: Record<DebtStatus, { cls: string; key: string }> = {
    OPEN: { cls: "bg-zinc-100 text-zinc-600", key: "debt.statusOpen" },
    PARTIAL: { cls: "bg-yellow-400/15 text-yellow-600", key: "debt.statusPartial" },
    PAID: { cls: "bg-emerald-50 text-emerald-600", key: "debt.statusPaid" },
    OVERDUE: { cls: "bg-red-50 text-red-600", key: "debt.statusOpen" },
  };
  const s = map[status];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>{t(s.key)}</span>;
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
    <div className={`rounded-2xl border p-5 ${dark ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white"}`}>
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          dark || accent ? "bg-yellow-400 text-zinc-900" : "bg-zinc-100 text-zinc-500"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className={`mt-4 text-sm ${dark ? "text-zinc-400" : "text-zinc-500"}`}>{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/40";

function AddDebtModal({
  defaultType,
  customerNames,
  supplierNames,
  onClose,
  onSaved,
}: {
  defaultType: DebtType;
  customerNames: string[];
  supplierNames: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [type, setType] = useState<DebtType>(defaultType);
  const [partyName, setPartyName] = useState("");
  const [amount, setAmount] = useState("");
  const [paidNow, setPaidNow] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isReceivable = type === "RECEIVABLE";
  const names = isReceivable ? customerNames : supplierNames;

  async function save() {
    setError(null);
    const amt = Number(onlyDigits(amount));
    const paid = Number(onlyDigits(paidNow)) || 0;
    if (!partyName.trim()) return setError(isReceivable ? "Nama pelanggan wajib diisi" : "Nama supplier wajib diisi");
    if (!amt || amt <= 0) return setError(t("common.errAmount"));
    if (paid > amt) return setError(t("debt.errPaidOver"));
    setSaving(true);
    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          partyName,
          amount: amt,
          paidAmount: paid,
          dueDate: dueDate || null,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan");
        return;
      }
      onSaved();
    } catch {
      setError(t("common.networkError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-bold">{t("debt.add")}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("RECEIVABLE")}
              className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                isReceivable ? "border-yellow-400 bg-yellow-400/10 text-zinc-900" : "border-zinc-200 text-zinc-500"
              }`}
            >
              {t("debt.receivable")}
            </button>
            <button
              type="button"
              onClick={() => setType("PAYABLE")}
              className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                !isReceivable ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-500"
              }`}
            >
              {t("debt.payable")}
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">
              {isReceivable ? t("debt.partyCustomer") : t("debt.partySupplier")}
            </label>
            <input
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              list="party-list"
              placeholder={isReceivable ? t("debt.partyCustomerPh") : t("debt.partySupplierPh")}
              className={inputCls}
            />
            <datalist id="party-list">
              {names.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">{t("debt.amount")}</label>
              <input
                type="text"
                inputMode="numeric"
                value={formatThousands(amount)}
                onChange={(e) => setAmount(onlyDigits(e.target.value))}
                placeholder="0"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">{t("debt.paidNow")}</label>
              <input
                type="text"
                inputMode="numeric"
                value={formatThousands(paidNow)}
                onChange={(e) => setPaidNow(onlyDigits(e.target.value))}
                placeholder="0"
                className={inputCls}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("debt.dueDate")}</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("debt.note")}</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("debt.notePh")}
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

function PayModal({ debt, onClose, onSaved }: { debt: DebtRow; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const remaining = debt.amount - debt.paidAmount;
  const [amount, setAmount] = useState(String(Math.round(remaining)));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    const amt = Number(onlyDigits(amount));
    if (!amt || amt <= 0) return setError(t("common.errAmount"));
    if (amt > remaining + 0.5) return setError(t("debt.errOverRemaining"));
    setSaving(true);
    try {
      const res = await fetch(`/api/debts/${debt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan");
        return;
      }
      onSaved();
    } catch {
      setError(t("common.networkError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="w-full max-w-sm rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-bold">{t("debt.payTitle")}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}
          <div className="rounded-xl bg-zinc-50 px-3 py-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">{debt.partyName}</span>
              <span className="font-semibold">{rupiah(debt.amount)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-zinc-500">{t("debt.remaining")}</span>
              <span className="font-bold text-zinc-900">{rupiah(remaining)}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("debt.payAmount")}</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatThousands(amount)}
              onChange={(e) => setAmount(onlyDigits(e.target.value))}
              placeholder="0"
              className={inputCls}
            />
            <p className="text-[11px] text-zinc-400">{t("debt.payHint")}</p>
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
            {t("debt.pay")}
          </button>
        </div>
      </div>
    </div>
  );
}
