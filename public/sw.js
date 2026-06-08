// Service worker minimal — cukup untuk membuat aplikasi installable (PWA).
// Strategi: network-first (selalu ambil versi terbaru), fallback cache shell
// hanya untuk navigasi saat offline. TIDAK meng-cache API/auth agar data tetap akurat.

const CACHE = "santamaria-v1";
const OFFLINE_SHELL = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Hanya tangani GET navigasi halaman; sisanya biarkan apa adanya.
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api")) return; // jangan cache API

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/").then((r) => r || Response.error()))
    );
  }
});
