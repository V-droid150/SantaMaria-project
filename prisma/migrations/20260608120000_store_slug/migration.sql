-- AlterTable: tambah kolom slug unik (nullable) untuk halaman katalog publik
ALTER TABLE "Store" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Store_slug_key" ON "Store"("slug");
