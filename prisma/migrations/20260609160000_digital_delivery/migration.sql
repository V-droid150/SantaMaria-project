-- Produk digital: konten/pengiriman
ALTER TABLE "Product" ADD COLUMN "digitalUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN "digitalInfo" TEXT;

-- Token akses halaman pesanan publik (untuk ambil produk digital setelah lunas)
ALTER TABLE "Order" ADD COLUMN "accessToken" TEXT;
CREATE UNIQUE INDEX "Order_accessToken_key" ON "Order"("accessToken");
