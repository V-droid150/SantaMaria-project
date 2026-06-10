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

// --- Web Push: tampilkan notifikasi saat ada pesanan/pembayaran/stok ---
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "SantaMaria", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "SantaMaria";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || undefined,
    data: { url: data.url || "/dashboard" },
    vibrate: [80, 40, 80],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Klik notifikasi -> fokus tab yang sudah terbuka atau buka tab baru.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if ("focus" in client) {
          client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })()
  );
});
