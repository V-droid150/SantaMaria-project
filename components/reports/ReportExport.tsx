"use client";

import { useState } from "react";
import { Download, FileText, FileSpreadsheet, FileType } from "lucide-react";
import { rupiah } from "@/lib/format";
import { useI18n } from "@/components/i18n/LanguageProvider";

// Ekspor laporan ke PDF (jendela cetak), Excel (.xls), atau CSV.
// Semua tanpa library tambahan.

export type LabaRugi = {
  omzet: number;
  hpp: number;
  labaKotor: number;
  pengeluaran: number;
  labaBersih: number;
};
type Best = { name: string; qty: number; revenue: number };
type Channel = { channel: string; total: number; count: number };

export default function ReportExport({
  storeName,
  monthName,
  labaRugi,
  bestSellers,
  channels,
}: {
  storeName: string;
  monthName: string;
  labaRugi: LabaRugi;
  bestSellers: Best[];
  channels: Channel[];
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const fileBase = `laporan-${monthName.replace(/\s/g, "-").toLowerCase()}`;

  function triggerDownload(content: BlobPart, mime: string, ext: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileBase}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const esc = (s: string) => s.replace(/;/g, ",");
    const lines: string[] = [];
    lines.push(`${esc(storeName)} — Laporan;${monthName}`);
    lines.push("");
    lines.push("Laba/Rugi;Jumlah (Rp)");
    lines.push(`Omzet;${labaRugi.omzet}`);
    lines.push(`HPP;${labaRugi.hpp}`);
    lines.push(`Laba kotor;${labaRugi.labaKotor}`);
    lines.push(`Pengeluaran;${labaRugi.pengeluaran}`);
    lines.push(`Laba bersih;${labaRugi.labaBersih}`);
    lines.push("");
    lines.push("Produk Terlaris;Qty;Pendapatan (Rp)");
    for (const b of bestSellers) lines.push(`${esc(b.name)};${b.qty};${b.revenue}`);
    lines.push("");
    lines.push("Per Channel;Transaksi;Total (Rp)");
    for (const c of channels) lines.push(`${esc(c.channel)};${c.count};${c.total}`);

    triggerDownload("﻿" + lines.join("\n"), "text/csv;charset=utf-8;", "csv");
    setOpen(false);
  }

  function exportExcel() {
    // Excel membuka tabel HTML ber-ekstensi .xls (tanpa library).
    const row = (cells: (string | number)[], header = false) =>
      `<tr>${cells
        .map((c) =>
          header
            ? `<th style="background:#18181b;color:#facc15;text-align:left;padding:6px 10px;border:1px solid #d4d4d8">${c}</th>`
            : `<td style="padding:6px 10px;border:1px solid #e4e4e7">${c}</td>`
        )
        .join("")}</tr>`;
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>
      <h2>${storeName} — Laporan ${monthName}</h2>
      <table>${row(["Laba/Rugi", "Jumlah (Rp)"], true)}
        ${row(["Omzet", labaRugi.omzet])}${row(["HPP", labaRugi.hpp])}${row(["Laba kotor", labaRugi.labaKotor])}
        ${row(["Pengeluaran", labaRugi.pengeluaran])}${row(["Laba bersih", labaRugi.labaBersih])}</table><br/>
      <table>${row(["Produk Terlaris", "Qty", "Pendapatan (Rp)"], true)}
        ${bestSellers.map((b) => row([b.name, b.qty, b.revenue])).join("")}</table><br/>
      <table>${row(["Per Channel", "Transaksi", "Total (Rp)"], true)}
        ${channels.map((c) => row([c.channel, c.count, c.total])).join("")}</table>
      </body></html>`;
    triggerDownload(html, "application/vnd.ms-excel;charset=utf-8;", "xls");
    setOpen(false);
  }

  function exportPdf() {
    const trow = (label: string, value: string, opts = "") =>
      `<tr><td style="padding:8px 0">${label}</td><td style="padding:8px 0;text-align:right;${opts}">${value}</td></tr>`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${fileBase}</title>
      <style>
        *{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#18181b}
        body{max-width:720px;margin:24px auto;padding:0 24px}
        h1{font-size:22px;margin:0}
        .sub{color:#71717a;font-size:13px;margin-top:2px}
        .badge{display:inline-block;background:#facc15;color:#18181b;font-weight:700;border-radius:8px;padding:6px 10px;font-size:12px}
        h2{font-size:15px;border-bottom:2px solid #facc15;padding-bottom:6px;margin:26px 0 8px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th{text-align:left;color:#71717a;font-weight:600;padding:6px 0;border-bottom:1px solid #e4e4e7}
        td{font-size:13px}
        .net{font-weight:700;font-size:15px;border-top:2px solid #18181b}
        .foot{margin-top:30px;color:#a1a1aa;font-size:11px;text-align:center}
        @media print{body{margin:0}}
      </style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><h1>${storeName}</h1><p class="sub">Laporan Keuangan — ${monthName}</p></div>
        <span class="badge">SantaMaria</span>
      </div>

      <h2>Laba / Rugi</h2>
      <table>
        ${trow("Omzet", rupiah(labaRugi.omzet))}
        ${trow("HPP", "− " + rupiah(labaRugi.hpp))}
        ${trow("Laba kotor", rupiah(labaRugi.labaKotor), "font-weight:700")}
        ${trow("Pengeluaran", "− " + rupiah(labaRugi.pengeluaran))}
        <tr class="net"><td style="padding:10px 0">Laba bersih</td><td style="padding:10px 0;text-align:right">${rupiah(
          labaRugi.labaBersih
        )}</td></tr>
      </table>

      <h2>Produk Terlaris</h2>
      <table><tr><th>Produk</th><th style="text-align:right">Qty</th><th style="text-align:right">Pendapatan</th></tr>
        ${bestSellers
          .map(
            (b) =>
              `<tr><td style="padding:6px 0">${b.name}</td><td style="text-align:right">${b.qty}</td><td style="text-align:right">${rupiah(
                b.revenue
              )}</td></tr>`
          )
          .join("")}
      </table>

      <h2>Penjualan per Channel</h2>
      <table><tr><th>Channel</th><th style="text-align:right">Transaksi</th><th style="text-align:right">Total</th></tr>
        ${channels
          .map(
            (c) =>
              `<tr><td style="padding:6px 0">${c.channel}</td><td style="text-align:right">${c.count}</td><td style="text-align:right">${rupiah(
                c.total
              )}</td></tr>`
          )
          .join("")}
      </table>

      <p class="foot">Dicetak dari SantaMaria · ${new Date().toLocaleDateString("id-ID")}</p>
      </body></html>`;

    const w = window.open("", "_blank", "width=820,height=900");
    if (!w) {
      alert(t("rep.popupBlocked"));
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 350);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-yellow-400 hover:text-zinc-900"
      >
        <Download className="h-4 w-4" /> {t("rep.export")}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
            <MenuItem icon={FileText} label={t("rep.exportPdf")} onClick={exportPdf} />
            <MenuItem icon={FileSpreadsheet} label={t("rep.exportExcel")} onClick={exportExcel} />
            <MenuItem icon={FileType} label={t("rep.exportCsv")} onClick={exportCsv} />
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-zinc-700 transition hover:bg-yellow-400/10"
    >
      <Icon className="h-4 w-4 text-zinc-400" /> {label}
    </button>
  );
}
