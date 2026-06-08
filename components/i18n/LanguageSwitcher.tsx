"use client";

import { Languages } from "lucide-react";
import { LANGS, LANG_LABEL } from "@/lib/i18n";
import { useI18n } from "@/components/i18n/LanguageProvider";

// Toggle bahasa ID <-> EN.
export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();

  if (compact) {
    const next = lang === "id" ? "en" : "id";
    return (
      <button
        onClick={() => setLang(next)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-600 transition hover:border-yellow-400 hover:text-zinc-900"
        aria-label="Ganti bahasa"
        title="Ganti bahasa"
      >
        <Languages className="h-4 w-4" />
        {lang.toUpperCase()}
      </button>
    );
  }

  return (
    <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5">
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
            lang === l ? "bg-yellow-400 text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
          }`}
          title={LANG_LABEL[l]}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
