import { NextResponse } from "next/server";
import {
  getOrigin,
  redirectUri,
  verifyState,
  decodeIdToken,
  upsertOAuthUser,
  redirectWithSession,
} from "@/lib/oauth";

// Callback Google: tukar code -> token, ambil profil, buat/masuk user.
export async function GET(req: Request) {
  const origin = getOrigin(req);
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) throw new Error("Parameter tidak lengkap");
    const verified = await verifyState(state);
    if (!verified || verified.provider !== "google") throw new Error("State tidak valid");

    // Tukar authorization code dengan token.
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri(req, "google"),
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) throw new Error("Gagal menukar token");
    const tokens = (await tokenRes.json()) as { id_token?: string };
    if (!tokens.id_token) throw new Error("id_token tidak ada");

    const profile = decodeIdToken(tokens.id_token);
    const user = await upsertOAuthUser({
      provider: "google",
      providerAccountId: profile.sub,
      email: profile.email,
      emailVerified: profile.emailVerified,
      name: profile.name,
      image: profile.picture,
    });

    return redirectWithSession(origin, user);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }
}
