-- Rekening/pembayaran penjual
ALTER TABLE "Store" ADD COLUMN "payoutBank" TEXT;
ALTER TABLE "Store" ADD COLUMN "payoutBankCode" TEXT;
ALTER TABLE "Store" ADD COLUMN "payoutAccount" TEXT;
ALTER TABLE "Store" ADD COLUMN "payoutName" TEXT;
ALTER TABLE "Store" ADD COLUMN "qrisImageUrl" TEXT;

-- Bukti pembayaran manual pada order
ALTER TABLE "Order" ADD COLUMN "paymentProofUrl" TEXT;
