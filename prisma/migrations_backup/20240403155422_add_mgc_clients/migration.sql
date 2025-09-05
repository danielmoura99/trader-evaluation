-- CreateTable
CREATE TABLE "mgc_clients" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "cpf" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "birthDate" TIMESTAMP(3) NOT NULL,
  "address" TEXT,
  "zipCode" TEXT,
  "platform" TEXT NOT NULL,
  "plan" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "cancellationDate" TIMESTAMP(3),
  "observation" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "mgc_clients_pkey" PRIMARY KEY ("id")
);