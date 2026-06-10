"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, ClipboardCheck, Boxes, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/components/i18n/LanguageProvider";

export type OpnameRow = { variantId: string; name: string; systemStock: number };

export default function OpnameClient({ rows }: { rows: OpnameRow[] }) {
  const router = useRouter();
  const { t } = useI18n();
  // Map variantId -> nilai fisik (string agar input nyaman). Kosong = belum dihitung.
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  const changes = useMemo(() => {
    return rows
      .map((r) => {
        const raw = counts[r.variantId];
        if (raw === undefined || raw === "") return null;
        const physical = Math.trunc(Number(raw));
        return { ...r, physical, diff: physical - r.systemStock };
      })
      .filter((x): x is OpnameRow & { physical: number; diff: number } => x !== null);
  }, [rows, counts]);

  const filledCount = changes.length;
  const diffCount = changes.filter((c) => c.diff !== 0).length;

  async function submit() {
    setError(null);
    if (filledCount === 0) return setError(t("op.fillOne"));
    setSaving(true);
    try {
      const res = await fetch("/api/opname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note,
          items: changes.map((c) => ({ variantId: c.variantId, physicalStock: c.physical })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan");
        return;
      }
      setDone(data.adjustedCount ?? 0);
      setCounts({});
      setNote("");
      router.refresh();
    } catch {
      setError(t("common.networkError"));
    } finally {
      setSaving(false);
    }
  }

  if (rows.length === 0) {
    return (
      <>
        <Header />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center text-zinc-400">
          <Boxes className="h-9 w-9" />
          <p className="text-sm">{t("op.emptyTitle")}</p>
          <Link href="/inventory" className="text-sm font-semibold text-zinc-700 hover:underline">
            {t("op.addFirst")}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />

      {done !== null && (
        <div className="flex items-center gap-2 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-700">
          <CheckCircle2 className="h-4 w-4" />
          {t("op.savedPrefix")} {done} {t("op.savedSuffix")}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3 font-semibold">{t("op.colProduct")}</th>
                <th className="px-5 py-3 font-semibold">{t("op.colSystem")}</th>
                <th className="px-5 py-3 font-semibold">{t("op.colPhysical")}</th>
                <th className="px-5 py-3 font-semibold">{t("op.colDiff")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((r) => {
                const raw = counts[r.variantId] ?? "";
                const physical = raw === "" ? null : Math.trunc(Number(raw));
                const diff = physical === null ? null : physical - r.systemStock;
                return (
                  <tr key={r.variantId} className="transition hover:bg-yellow-400/5">
                    <td className="px-5 py-3 font-medium text-zinc-900">{r.name}</td>
                    <td className="px-5 py-3 text-zinc-600">{r.systemStock}</td>
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={raw}
                        onChange={(e) =>
                          setCounts((c) => ({ ...c, [r.variantId]: e.target.value.replace(/\D/g, "") }))
                        }
                        placeholder="—"
                        className="w-24 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm outline-none focus:border-yellow-400 focus:bg-white"
                      />
                    </td>
                    <td className="px-5 py-3">
                      {diff === null ? (
                        <span className="text-zinc-300">—</span>
                      ) : diff === 0 ? (
                        <span className="text-zinc-400">0</span>
                      ) : (
                        <span className={`font-semibold ${diff > 0 ? "text-yellow-600" : "text-red-500"}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aksi */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("op.notePh")}
          className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-yellow-400 focus:bg-white"
        />
        <div className="text-xs text-zinc-500 sm:text-right">
          {filledCount} {t("op.filled")} · {diffCount} {t("op.changed")}
        </div>
        <button
          onClick={submit}
          disabled={saving || filledCount === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-zinc-900 transition hover:bg-yellow-300 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("op.save")}
        </button>
      </div>
    </>
  );
}

function Header() {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link
          href="/inventory"
          className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          aria-label={t("common.back")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ClipboardCheck className="h-6 w-6 text-yellow-500" /> {t("op.title")}
          </h1>
          <p className="text-sm text-zinc-500">{t("op.subtitle")}</p>
        </div>
      </div>
    </div>
  );
}
