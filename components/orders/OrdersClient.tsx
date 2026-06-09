"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Inbox, Loader2, Image as ImageIcon } from "lucide-react";
import { rupiah, tanggalJam } from "@/lib/format";
import { useI18n } from "@/components/i18n/LanguageProvider";

export type OrderRow = {
  id: string;
  orderNumber: string;
  channel: string;
  total: number;
  status: string;
  paymentStatus: string;
  proof: string | null;
  createdAt: string;
  customer: string;
  phone: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-yellow-400 text-zinc-900",
  COMPLETED: "bg-yellow-400 text-zinc-900",
  PENDING: "bg-white text-zinc-900 border border-zinc-300",
  CANCELLED: "bg-zinc-100 text-zinc-400",
  REFUNDED: "bg-zinc-100 text-zinc-400",
};
const STATUS_LABEL: Record<string, string> = {
  PAID: "Lunas",
  COMPLETED: "Selesai",
  PENDING: "Pending",
  CANCELLED: "Batal",
  REFUNDED: "Refund",
};

export default function OrdersClient({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const { t } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);
  const [proof, setProof] = useState<string | null>(null);

  async function act(o: OrderRow, action: "confirm" | "cancel") {
    if (!confirm(action === "confirm" ? t("ord.confirmAsk") : t("ord.cancelAsk"))) return;
    setBusy(o.id);
    try {
      const res = await fetch(`/api/orders/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) router.refresh();
      else {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? t("common.networkError"));
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("ord.title")}</h1>
        <p className="text-sm text-zinc-500">{t("ord.subtitle")}</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center text-zinc-400">
          <Inbox className="h-9 w-9" />
          <p className="text-sm">{t("ord.empty")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-semibold">{t("ord.colNo")}</th>
                  <th className="px-5 py-3 font-semibold">{t("ord.colCustomer")}</th>
                  <th className="px-5 py-3 font-semibold">{t("ord.colChannel")}</th>
                  <th className="px-5 py-3 font-semibold">{t("ord.colTotal")}</th>
                  <th className="px-5 py-3 font-semibold">{t("ord.colStatus")}</th>
                  <th className="px-5 py-3 text-right font-semibold">{t("ord.colAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {orders.map((o) => (
                  <tr key={o.id} className="transition hover:bg-yellow-400/5">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-zinc-900">{o.orderNumber}</p>
                      <p className="text-xs text-zinc-400">{tanggalJam(o.createdAt)}</p>
                    </td>
                    <td className="px-5 py-4 text-zinc-700">
                      {o.customer}
                      {o.phone && <p className="text-xs text-zinc-400">{o.phone}</p>}
                    </td>
                    <td className="px-5 py-4 text-zinc-500">{o.channel}</td>
                    <td className="px-5 py-4 font-semibold text-zinc-900">{rupiah(o.total)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLE[o.status] ?? "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {o.proof && (
                          <button
                            onClick={() => setProof(o.proof)}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs font-semibold text-zinc-600 hover:border-yellow-400"
                          >
                            <ImageIcon className="h-3.5 w-3.5" /> {t("ord.viewProof")}
                          </button>
                        )}
                        {o.status === "PENDING" && o.paymentStatus !== "PAID" && (
                          <>
                            <button
                              onClick={() => act(o, "confirm")}
                              disabled={busy === o.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-yellow-400 px-2.5 py-1.5 text-xs font-bold text-zinc-900 transition hover:bg-yellow-300 disabled:opacity-50"
                            >
                              {busy === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              {t("ord.confirm")}
                            </button>
                            <button
                              onClick={() => act(o, "cancel")}
                              disabled={busy === o.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5" /> {t("ord.cancel")}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pratinjau bukti transfer */}
      {proof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setProof(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={proof} alt="Bukti transfer" className="max-h-[85vh] max-w-full rounded-xl" />
        </div>
      )}
    </>
  );
}
