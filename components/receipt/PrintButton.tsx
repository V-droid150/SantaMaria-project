"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

export default function PrintButton({ auto = false }: { auto?: boolean }) {
  useEffect(() => {
    if (auto) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [auto]);

  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-yellow-300"
    >
      <Printer className="h-4 w-4" /> Cetak Struk
    </button>
  );
}
