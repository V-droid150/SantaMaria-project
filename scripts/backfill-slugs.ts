import { PrismaClient } from "@prisma/client";

// Isi slug untuk toko lama yang belum punya (mandiri, tanpa alias path).
const prisma = new PrismaClient();

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "toko"
  );
}
function suffix(n = 5): string {
  const c = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: n }, () => c[Math.floor(Math.random() * c.length)]).join("");
}

async function main() {
  const stores = await prisma.store.findMany({ where: { slug: null }, select: { id: true, name: true } });
  for (const s of stores) {
    let slug = `${slugify(s.name)}-${suffix()}`;
    // pastikan unik
    while (await prisma.store.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${slugify(s.name)}-${suffix()}`;
    }
    await prisma.store.update({ where: { id: s.id }, data: { slug } });
    console.log(`${s.name} -> ${slug}`);
  }
  console.log(`✅ ${stores.length} toko dibackfill.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
