import "server-only";

// Pengiriman email via Resend (https://resend.com) — gated by RESEND_API_KEY.
// Tanpa key, isEmailConfigured() = false (alur tetap aman, lihat pemanggil).

const API_KEY = process.env.RESEND_API_KEY || "";
// FROM harus dari domain terverifikasi di Resend. Default: domain uji Resend.
const FROM = process.env.EMAIL_FROM || "SantaMaria <onboarding@resend.dev>";

export function isEmailConfigured(): boolean {
  return Boolean(API_KEY);
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!API_KEY) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ from: FROM, to: params.to, subject: params.subject, html: params.html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Origin aplikasi untuk menyusun link absolut di email.
export function appOrigin(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3001";
  return `${proto}://${host}`;
}
