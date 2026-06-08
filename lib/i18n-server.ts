import "server-only";
import { cookies } from "next/headers";
import { LANGS, t as translate, type Lang } from "@/lib/i18n";

// Baca bahasa dari cookie (di-set oleh LanguageProvider) untuk Server Components.
export function getServerLang(): Lang {
  const c = cookies().get("lang")?.value;
  return c && (LANGS as readonly string[]).includes(c) ? (c as Lang) : "id";
}

// Pengembali fungsi t() untuk dipakai langsung di Server Component.
export function getServerT() {
  const lang = getServerLang();
  return { lang, t: (key: string) => translate(lang, key) };
}
