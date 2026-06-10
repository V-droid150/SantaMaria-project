import "server-only";

// Verifikasi anti-bot Cloudflare Turnstile (server-side).
// Gated: bila TURNSTILE_SECRET_KEY belum diisi, verifikasi DILEWATI agar
// dev lokal & lingkungan tanpa kunci tetap berjalan (pola sama dgn Midtrans/OAuth).

const SECRET = process.env.TURNSTILE_SECRET_KEY || "";
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileConfigured(): boolean {
  return Boolean(SECRET);
}

// Mengembalikan true bila token valid (atau bila fitur belum dikonfigurasi).
export async function verifyTurnstile(
  token: string | undefined | null,
  ip?: string | null
): Promise<boolean> {
  if (!SECRET) return true; // belum dikonfigurasi -> lewati
  if (!token) return false;

  try {
    const form = new URLSearchParams();
    form.append("secret", SECRET);
    form.append("response", token);
    if (ip) form.append("remoteip", ip);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
