"use client";

import { Download } from "lucide-react";

// Ekspor laporan ringkas ke CSV (tanpa library tambahan).
// CSV bisa dibuka di Excel/Google Sheets.
export default function ReportExport({
  monthName,
  labaRugi,
  bestSellers,
}: {
  monthName: string;
  labaRugi: { omzet: number; hpp: number; labaKotor: number; pengeluaran: number; labaBersih: number };
  bestSellers: { name: string; qty: number; revenue: number }[];
}) {
  function download() {
    const lines: string[] = [];
    lines.push(`Laporan SantaMaria;${monthName}`);
    lines.push("");
    lines.push("Laba/Rugi;Jumlah (Rp)");
    lines.push(`Omzet;${labaRugi.omzet}`);
    lines.push(`HPP;${labaRugi.hpp}`);
    lines.push(`Laba kotor;${labaRugi.labaKotor}`);
    lines.push(`Pengeluaran;${labaRugi.pengeluaran}`);
    lines.push(`Laba bersih;${labaRugi.labaBersih}`);
    lines.push("");
    lines.push("Produk Terlaris;Qty;Pendapatan (Rp)");
    for (const b of bestSellers) {
      lines.push(`${b.name.replace(/;/g, ",")};${b.qty};${b.revenue}`);
    }

    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-${monthName.replace(/\s/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-yellow-400 hover:text-zinc-900"
    >
      <Download className="h-4 w-4" /> Unduh CSV
    </button>
  );
}
