import { PrismaClient } from "@prisma/client";

// Hapus data transaksi/penjualan agar dashboard kembali kosong.
// TIDAK menghapus produk, pelanggan, toko, atau akun.
const prisma = new PrismaClient();

async function main() {
  const mv = await prisma.stockMovement.deleteMany({});
  const cf = await prisma.cashFlow.deleteMany({});
  await prisma.stockOpnameItem.deleteMany({});
  const op = await prisma.stockOpname.deleteMany({});
  await prisma.debt.deleteMany({});
  await prisma.orderItem.deleteMany({});
  const ord = await prisma.order.deleteMany({});
  console.log(
    `✅ Reset selesai — order: ${ord.count}, arus kas: ${cf.count}, mutasi stok: ${mv.count}, opname: ${op.count}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
