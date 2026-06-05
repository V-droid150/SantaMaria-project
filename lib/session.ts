import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";

// Helper session berbasis JWT (jose) — edge-safe, bisa dipakai di middleware.
// TIDAK mengimpor next/headers agar aman di Edge Runtime.

export type SessionPayload = {
  userId: string;
  name: string;
  role: Role;
  storeId: string;
};

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-ganti-di-produksi-minimal-32-karakter"
);

const ISSUER = "santamaria";
const EXPIRES = "7d";

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setExpirationTime(EXPIRES)
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { issuer: ISSUER });
    return {
      userId: String(payload.userId),
      name: String(payload.name),
      role: payload.role as Role,
      storeId: String(payload.storeId),
    };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "santamaria_session";
