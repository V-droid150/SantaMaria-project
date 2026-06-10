import { PrismaClient } from "@prisma/client";

// Menonaktifkan akun DEMO bawaan seed (admin/kasir/gudang @santamaria.id) yang
// memakai password publik "password123". WAJIB dijalankan di DB produksi karena
// kredensial demo ada di repo -> siapa pun bisa login tanpa langkah ini.
//
// Jalankan: npx tsx scripts/secure-demo-users.ts
// (pakai DATABASE_URL produksi di .env)
//
// Reversibel: untuk mengaktifkan lagi, set isActive=true manual via Prisma Studio.

const prisma = new PrismaClient();

const DEMO_EMAILS = [
  "admin@santamaria.id",
  "kasir@santamaria.id",
  "gudang@santamaria.id",
];

async function main() {
  const res = await prisma.user.updateMany({
    where: { email: { in: DEMO_EMAILS }, isActive: true },
    data: { isActive: false },
  });
  console.log(`🔒 ${res.count} akun demo dinonaktifkan (login diblokir).`);
  if (res.count === 0) {
    console.log("   (Tidak ada akun demo aktif — kemungkinan sudah aman.)");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
