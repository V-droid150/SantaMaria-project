"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, BellOff } from "lucide-react";

// Tombol aktif/nonaktif notifikasi Web Push di topbar.
// Gated: tampil hanya bila VAPID public key ada & browser mendukung Push.

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

type State = "loading" | "unsupported" | "default" | "denied" | "subscribed";

// Konversi VAPID public key (base64url) -> Uint8Array utk pushManager.subscribe.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function NotificationButton() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (
      !VAPID ||
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setState(sub ? "subscribed" : "default");
      })
      .catch(() => setState("default"));
  }, []);

  async function enable() {
    if (busy) return;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "default");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID!) as BufferSource,
        });
      }
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (res.ok) setState("subscribed");
    } catch {
      /* batal / gagal -> biarkan state apa adanya */
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (busy) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("default");
    } catch {
      /* abaikan */
    } finally {
      setBusy(false);
    }
  }

  if (state === "unsupported" || state === "loading") return null;

  const Icon = state === "subscribed" ? BellRing : state === "denied" ? BellOff : Bell;
  const label =
    state === "subscribed"
      ? "Notifikasi aktif — klik untuk matikan"
      : state === "denied"
        ? "Notifikasi diblokir di pengaturan browser"
        : "Aktifkan notifikasi pesanan";

  return (
    <button
      onClick={state === "subscribed" ? disable : state === "denied" ? undefined : enable}
      disabled={busy || state === "denied"}
      title={label}
      aria-label={label}
      className="relative rounded-lg p-2 text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon className={`h-5 w-5 ${state === "subscribed" ? "text-yellow-500" : ""}`} />
      {state === "subscribed" && (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-yellow-400" />
      )}
      {state === "default" && (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-red-400" />
      )}
    </button>
  );
}
