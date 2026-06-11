import type { MetadataRoute } from "next";

// Manifest PWA — membuat aplikasi bisa di-"Install / Add to Home Screen".
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SantaMaria — Your Business Partner",
    short_name: "SantaMaria",
    description: "Aplikasi kasir & manajemen bisnis untuk UMKM: POS, inventaris, keuangan, laporan.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafafa",
    theme_color: "#18181b",
    lang: "id",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
