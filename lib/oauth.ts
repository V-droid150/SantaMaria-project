import { NextResponse } from "next/server";
import { SignJWT, jwtVerify, importPKCS8, decodeJwt } from "jose";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { signSession, SESSION_COOKIE } from "@/lib/session";

/* ===========================================================================
 * Helper OAuth (Google & Apple) tanpa library tambahan — pakai jose + fetch.
 * State ditandatangani (HS256) agar tahan CSRF tanpa bergantung cookie
 * (penting untuk Apple yang callback-nya POST/form_post lintas-site).
 * ========================================================================= */

const STATE_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-ganti-di-produksi-minimal-32-karakter"
);

export type OAuthProvider = "google" | "apple";

export function isGoogleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function isAppleConfigured() {
  return Boolean(
    process.env.APPLE_CLIENT_ID &&
      process.env.APPLE_TEAM_ID &&
      process.env.APPLE_KEY_ID &&
      process.env.APPLE_PRIVATE_KEY
  );
}

// Origin aplikasi untuk menyusun redirect_uri (harus cocok dgn konfigurasi provider).
export function getOrigin(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, "");
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}

export function redirectUri(req: Request, provider: OAuthProvider): string {
  return `${getOrigin(req)}/api/auth/oauth/${provider}/callback`;
}

// ---- State (CSRF) ----
export async function signState(data: { from: string; provider: OAuthProvider }): Promise<string> {
  return new SignJWT({ ...data, nonce: crypto.randomUUID() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(STATE_SECRET);
}

export async function verifyState(
  token: string
): Promise<{ from: string; provider: OAuthProvider } | null> {
  try {
    const { payload } = await jwtVerify(token, STATE_SECRET);
    return { from: String(payload.from), provider: payload.provider as OAuthProvider };
  } catch {
    return null;
  }
}

// ---- Apple client secret (ES256 JWT yang ditandatangani dgn .p8) ----
export async function appleClientSecret(): Promise<string> {
  const teamId = process.env.APPLE_TEAM_ID!;
  const keyId = process.env.APPLE_KEY_ID!;
  const clientId = process.env.APPLE_CLIENT_ID!;
  // Private key bisa berisi "\n" literal pada env -> normalkan.
  const pkcs8 = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const key = await importPKCS8(pkcs8, "ES256");

  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .setExpirationTime("5m")
    .setAudience("https://appleid.apple.com")
    .setSubject(clientId)
    .sign(key);
}

// Decode id_token (token datang langsung dari endpoint provider via TLS).
export function decodeIdToken(idToken: string): {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
} {
  const p = decodeJwt(idToken);
  return {
    sub: String(p.sub),
    email: typeof p.email === "string" ? p.email : undefined,
    name: typeof p.name === "string" ? p.name : undefined,
    picture: typeof p.picture === "string" ? p.picture : undefined,
  };
}

/* ---------------------------------------------------------------------------
 * Cari/buat user dari profil OAuth:
 * 1) Sudah ada Account (provider+sub) -> pakai user itu.
 * 2) Email cocok dgn user lain -> tautkan Account ke user tsb.
 * 3) Baru -> buat Store + User (ADMIN) + Account.
 * ------------------------------------------------------------------------- */
export async function upsertOAuthUser(input: {
  provider: OAuthProvider;
  providerAccountId: string;
  email?: string;
  name?: string;
  image?: string;
}) {
  const { provider, providerAccountId, email, name, image } = input;

  const existingAccount = await prisma.account.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId } },
  });
  if (existingAccount) {
    return prisma.user.update({
      where: { id: existingAccount.userId },
      data: { lastLoginAt: new Date() },
    });
  }

  if (email) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      await prisma.account.create({ data: { provider, providerAccountId, userId: byEmail.id } });
      return prisma.user.update({
        where: { id: byEmail.id },
        data: { lastLoginAt: new Date(), image: byEmail.image ?? image ?? null },
      });
    }
  }

  const displayName = name?.trim() || "Pengguna";
  return prisma.$transaction(async (tx) => {
    const store = await tx.store.create({
      data: { name: `Toko ${displayName.split(" ")[0]}` },
    });
    const user = await tx.user.create({
      data: {
        name: displayName,
        // Apple bisa menyembunyikan email -> fallback alamat sintetis unik.
        email: email ?? `${providerAccountId}@${provider}.santamaria.local`,
        image: image ?? null,
        role: Role.ADMIN,
        storeId: store.id,
        lastLoginAt: new Date(),
      },
    });
    await tx.account.create({ data: { provider, providerAccountId, userId: user.id } });
    return user;
  });
}

// Buat NextResponse redirect + set cookie session untuk user.
export async function redirectWithSession(
  origin: string,
  user: { id: string; name: string; role: Role; storeId: string; onboardedAt: Date | null }
): Promise<NextResponse> {
  const token = await signSession({
    userId: user.id,
    name: user.name,
    role: user.role,
    storeId: user.storeId,
    onboarded: user.onboardedAt !== null,
  });

  const dest = user.onboardedAt !== null ? "/dashboard" : "/onboarding";
  const res = NextResponse.redirect(`${origin}${dest}`);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
