import { NextResponse } from "next/server";
import {
  getOrigin,
  redirectUri,
  verifyState,
  decodeIdToken,
  appleClientSecret,
  upsertOAuthUser,
  redirectWithSession,
} from "@/lib/oauth";

// Callback Apple (form_post -> POST). Nama user hanya dikirim sekali (login pertama).
export async function POST(req: Request) {
  const origin = getOrigin(req);
  try {
    const form = await req.formData();
    const code = form.get("code")?.toString();
    const state = form.get("state")?.toString();
    const userRaw = form.get("user")?.toString(); // JSON {name:{firstName,lastName},email}

    if (!code || !state) throw new Error("Parameter tidak lengkap");
    const verified = await verifyState(state);
    if (!verified || verified.provider !== "apple") throw new Error("State tidak valid");

    const clientSecret = await appleClientSecret();
    const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.APPLE_CLIENT_ID!,
        client_secret: clientSecret,
        redirect_uri: redirectUri(req, "apple"),
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) throw new Error("Gagal menukar token");
    const tokens = (await tokenRes.json()) as { id_token?: string };
    if (!tokens.id_token) throw new Error("id_token tidak ada");

    const profile = decodeIdToken(tokens.id_token);

    // Nama dari payload "user" (hanya tersedia saat pertama kali).
    let name = profile.name;
    if (userRaw) {
      try {
        const parsed = JSON.parse(userRaw) as { name?: { firstName?: string; lastName?: string } };
        const full = [parsed.name?.firstName, parsed.name?.lastName].filter(Boolean).join(" ");
        if (full) name = full;
      } catch {
        /* abaikan */
      }
    }

    const user = await upsertOAuthUser({
      provider: "apple",
      providerAccountId: profile.sub,
      email: profile.email,
      name,
    });

    return redirectWithSession(origin, user);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }
}
