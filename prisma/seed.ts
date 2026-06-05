import { PrismaClient, ProductType, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding SantaMaria...");

  // 1) Toko
  const store = await prisma.store.upsert({
    where: { id: "store-demo" },
    update: {},
    create: {
      id: "store-demo",
      name: "Toko SantaMaria",
      address: "Jl. Merdeka No. 1, Jakarta",
      phone: "+62 812-0000-0000",
      email: "halo@santamaria.id",
      taxRate: 11, // PPN 11%
    },
  });

  // 2) Users (Admin, Kasir, Staf Gudang) — password demo: "password123"
  const passwordHash = await bcrypt.hash("password123", 10);

  const users: { email: string; name: string; role: Role }[] = [
    { email: "admin@santamaria.id", name: "Admin Utama", role: Role.ADMIN },
    { email: "kasir@santamaria.id", name: "Kasir Satu", role: Role.KASIR },
    { email: "gudang@santamaria.id", name: "Staf Gudang", role: Role.STAF_GUDANG },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: { ...u, passwordHash, storeId: store.id },
    });
  }

  // 3) Kategori
  const minuman = await prisma.category.upsert({
    where: { storeId_name: { storeId: store.id, name: "Minuman" } },
    update: {},
    create: { name: "Minuman", storeId: store.id },
  });
  const makanan = await prisma.category.upsert({
    where: { storeId_name: { storeId: store.id, name: "Makanan" } },
    update: {},
    create: { name: "Makanan", storeId: store.id },
  });

  // 4) Produk + varian (stok ada di varian)
  const products = [
    {
      name: "Kopi Susu Gula Aren",
      categoryId: minuman.id,
      type: ProductType.PHYSICAL,
      variants: [
        { name: "Regular", sku: "KS-REG", price: 18000, costPrice: 8000, stock: 100, reorderPoint: 20 },
        { name: "Large", sku: "KS-LRG", price: 23000, costPrice: 10000, stock: 80, reorderPoint: 20 },
      ],
    },
    {
      name: "Roti Bakar Coklat",
      categoryId: makanan.id,
      type: ProductType.PHYSICAL,
      variants: [{ name: "Default", sku: "RB-CKL", price: 15000, costPrice: 6000, stock: 50, reorderPoint: 10 }],
    },
    {
      name: "E-Voucher Pulsa 50rb",
      categoryId: null,
      type: ProductType.DIGITAL,
      variants: [{ name: "Default", sku: "EV-50", price: 51000, costPrice: 49000, stock: 9999, reorderPoint: 0 }],
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({
      where: { storeId: store.id, name: p.name },
    });
    if (existing) continue;
    await prisma.product.create({
      data: {
        name: p.name,
        type: p.type,
        storeId: store.id,
        categoryId: p.categoryId,
        variants: { create: p.variants },
      },
    });
  }

  // 5) Pelanggan contoh
  await prisma.customer.upsert({
    where: { id: "cust-demo" },
    update: {},
    create: { id: "cust-demo", name: "Budi Santoso", phone: "+62 813-1111-2222", storeId: store.id, points: 120 },
  });

  console.log("✅ Seed selesai. Login: admin@santamaria.id / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
