import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SantaMaria — UMKM Dashboard",
  description:
    "Aplikasi SaaS untuk mengelola operasional UMKM: POS, inventaris, keuangan, CRM, dan laporan.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
