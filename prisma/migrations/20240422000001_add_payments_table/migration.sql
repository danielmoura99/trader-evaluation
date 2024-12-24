-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "hublaPaymentId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerTaxId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "formToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_hublaPaymentId_key" ON "payments"("hublaPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_formToken_key" ON "payments"("formToken");