import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "@/lib/session";

// Helper auth khusus server (Server Components / Route Handlers).
// Membaca cookie httpOnly dan memvalidasi session.

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

// Pastikan ada session; jika tidak, pemanggil yang menentukan redirect.
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}
