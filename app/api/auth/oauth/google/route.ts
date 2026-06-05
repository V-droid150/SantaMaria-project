import { NextResponse } from "next/server";
import { getOrigin, redirectUri, signState, isGoogleConfigured } from "@/lib/oauth";

// Mulai alur OAuth Google: redirect ke halaman consent Google.
export async function GET(req: Request) {
  const origin = getOrigin(req);
  if (!isGoogleConfigured()) {
    return NextResponse.redirect(`${origin}/login?error=oauth_not_configured`);
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || "/dashboard";
  const state = await signState({ from, provider: "google" });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(req, "google"),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
