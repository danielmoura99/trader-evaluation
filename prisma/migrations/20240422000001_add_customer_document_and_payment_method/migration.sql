-- AlterTable
ALTER TABLE "payments" 
ADD COLUMN "customerDocument" TEXT,
ADD COLUMN "paymentMethod" TEXT;

-- Atualizar registros existentes com valores padrão
UPDATE "payments" 
SET "customerDocument" = '', 
    "paymentMethod" = 'unknown'
WHERE "customerDocument" IS NULL 
OR "paymentMethod" IS NULL;

-- Tornar as colunas NOT NULL após preencher os dados
ALTER TABLE "payments" 
ALTER COLUMN "customerDocument" SET NOT NULL,
ALTER COLUMN "paymentMethod" SET NOT NULL;