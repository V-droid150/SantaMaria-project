import { prisma } from "@/lib/prisma";

// Ubah teks jadi slug URL-aman: "Kopi Senja!" -> "kopi-senja"
export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "toko"
  );
}

function randomSuffix(n = 5): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// Buat slug unik berbasis nama toko (selalu pakai sufiks acak agar tidak mudah ditebak & anti-bentrok).
export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = `${base}-${randomSuffix()}`;
    const exists = await prisma.store.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
  // Fallback sangat jarang: pakai sufiks lebih panjang.
  return `${base}-${randomSuffix(10)}`;
}
