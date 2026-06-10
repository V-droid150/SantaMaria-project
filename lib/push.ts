import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// Pengiriman Web Push (server-side). Gated by VAPID env keys.
// Bila belum dikonfigurasi, semua fungsi no-op -> app tetap jalan.

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@santamaria.id";

let vapidSet = false;

export function isPushConfigured(): boolean {
  return Boolean(PUBLIC_KEY && PRIVATE_KEY);
}

function ensureVapid() {
  if (!vapidSet && isPushConfigured()) {
    webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
    vapidSet = true;
  }
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string; // tujuan saat notifikasi diklik
  tag?: string; // notif dgn tag sama akan saling menimpa (cegah spam)
};

// Kirim notifikasi ke semua perangkat milik daftar user (best-effort).
// Langganan yang sudah mati (404/410) otomatis dihapus.
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  if (!isPushConfigured() || userIds.length === 0) return;
  ensureVapid();

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });
  if (subs.length === 0) return;

  const data = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data
        );
      } catch (err) {
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        }
      }
    })
  );
}

// Semua staf aktif di sebuah toko = penerima notifikasi.
export async function getStoreUserIds(storeId: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { storeId, isActive: true },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

// Bungkus pengiriman agar tidak pernah menggagalkan alur utama (mis. checkout).
export async function notifyStore(storeId: string, payload: PushPayload): Promise<void> {
  try {
    const userIds = await getStoreUserIds(storeId);
    await sendPushToUsers(userIds, payload);
  } catch {
    /* jangan ganggu request utama */
  }
}

// Cek varian (yang baru saja terjual) yang stoknya kini <= titik reorder,
// lalu kirim satu notifikasi pengingat restok. Best-effort.
export async function notifyLowStock(storeId: string, variantIds: string[]): Promise<void> {
  try {
    if (!isPushConfigured() || variantIds.length === 0) return;
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds }, isActive: true, reorderPoint: { gt: 0 } },
      select: { name: true, stock: true, reorderPoint: true, product: { select: { name: true } } },
    });
    const low = variants.filter((v) => v.stock <= v.reorderPoint);
    if (low.length === 0) return;

    const first = low[0];
    const label = `${first.product.name}${first.name !== "Default" ? ` (${first.name})` : ""}`;
    const more = low.length > 1 ? ` +${low.length - 1} produk lain` : "";
    await notifyStore(storeId, {
      title: "Stok menipis ⚠️",
      body: `${label} tersisa ${first.stock}${more}. Saatnya restok.`,
      url: "/inventory",
      tag: "low-stock",
    });
  } catch {
    /* abaikan */
  }
}
