// Service worker minimal — HANYA untuk installability (PWA).
// TIDAK meng-cache & TIDAK mengintersepsi request apa pun, agar tidak
// mengganggu navigasi Next.js (mencegah bug "harus klik 2x").
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Bersihkan cache lama dari versi service worker sebelumnya.
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Fetch handler ada (syarat installable) tapi dibiarkan default (passthrough).
self.addEventListener("fetch", () => {});
