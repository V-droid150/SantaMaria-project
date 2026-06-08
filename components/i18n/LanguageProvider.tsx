"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { t as translate, type Lang } from "@/lib/i18n";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string };

const LanguageContext = createContext<Ctx>({
  lang: "id",
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const router = useRouter();

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l);
      document.cookie = `lang=${l};path=/;max-age=31536000;samesite=lax`;
      try {
        localStorage.setItem("lang", l);
      } catch {
        /* abaikan */
      }
      router.refresh(); // agar Server Component ikut ganti bahasa
    },
    [router]
  );

  const t = useCallback((key: string) => translate(lang, key), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
}

export const useI18n = () => useContext(LanguageContext);
