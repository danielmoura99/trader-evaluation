-- AlterTable
ALTER TABLE "payments" ADD COLUMN "customerDocument" TEXT NOT NULL;
ALTER TABLE "payments" ADD COLUMN "paymentMethod" TEXT NOT NULL;