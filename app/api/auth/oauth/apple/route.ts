import { NextResponse } from "next/server";
import { getOrigin, redirectUri, signState, isAppleConfigured } from "@/lib/oauth";

// Mulai alur Sign in with Apple.
export async function GET(req: Request) {
  const origin = getOrigin(req);
  if (!isAppleConfigured()) {
    return NextResponse.redirect(`${origin}/login?error=oauth_not_configured`);
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || "/dashboard";
  const state = await signState({ from, provider: "apple" });

  const params = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID!,
    redirect_uri: redirectUri(req, "apple"),
    response_type: "code",
    scope: "name email",
    response_mode: "form_post", // Apple mengembalikan via POST
    state,
  });

  return NextResponse.redirect(`https://appleid.apple.com/auth/authorize?${params}`);
}
