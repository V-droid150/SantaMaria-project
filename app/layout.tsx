import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerLang } from "@/lib/i18n-server";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SantaMaria — UMKM Dashboard",
  description:
    "Aplikasi SaaS untuk mengelola operasional UMKM: POS, inventaris, keuangan, CRM, dan laporan.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = getServerLang();
  return (
    <html lang={lang}>
      <body className={`${inter.variable} font-sans antialiased`}>
        <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
