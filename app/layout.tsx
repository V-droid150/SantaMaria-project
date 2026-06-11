import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerLang } from "@/lib/i18n-server";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import RegisterSW from "@/components/pwa/RegisterSW";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SantaMaria — Your Business Partner",
  description:
    "Aplikasi SaaS untuk mengelola operasional UMKM: POS, inventaris, keuangan, CRM, dan laporan.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "SantaMaria" },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = getServerLang();
  return (
    <html lang={lang}>
      <body className={`${inter.variable} font-sans antialiased`}>
        <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
