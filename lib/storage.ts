import "server-only";
import { createClient } from "@supabase/supabase-js";

// Supabase Storage untuk file besar (video produk). URL diturunkan dari
// project ref di DATABASE_URL bila SUPABASE_URL tidak diset.

export const STORAGE_BUCKET = process.env.SUPABASE_BUCKET || "products";

function resolveUrl(): string | null {
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL.replace(/\/$/, "");
  // Turunkan dari DATABASE_URL: postgres.<ref>:...  -> https://<ref>.supabase.co
  const m = process.env.DATABASE_URL?.match(/postgres\.([a-z0-9]+):/i);
  return m ? `https://${m[1]}.supabase.co` : null;
}

export function isStorageConfigured(): boolean {
  return Boolean(resolveUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getStorageClient() {
  const url = resolveUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase Storage belum dikonfigurasi");
  return createClient(url, key, { auth: { persistSession: false } });
}
