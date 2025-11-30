-- Migration Manual: Adicionar Sistema de Renovação de Plataforma
-- SAFE: Apenas ADDs, nenhum DROP ou DELETE
-- Execute este SQL diretamente no banco de dados de produção

-- 1. Adicionar novos campos em clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS "autoRenewalEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "lastRenewalDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "renewalPaymentId" TEXT;

-- 2. Criar tabela platform_renewals
CREATE TABLE IF NOT EXISTS platform_renewals (
    id TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT,
    "paidAccountId" TEXT,
    "renewalType" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "renewalDate" TIMESTAMP(3) NOT NULL,
    amount INTEGER NOT NULL,
    platform TEXT NOT NULL,
    status TEXT NOT NULL,
    "pixCode" TEXT,
    "pixExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Criar foreign keys para platform_renewals
ALTER TABLE platform_renewals
ADD CONSTRAINT IF NOT EXISTS "platform_renewals_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES clients(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE platform_renewals
ADD CONSTRAINT IF NOT EXISTS "platform_renewals_paidAccountId_fkey"
    FOREIGN KEY ("paidAccountId") REFERENCES paid_accounts(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS "idx_platform_renewals_clientId" ON platform_renewals("clientId");
CREATE INDEX IF NOT EXISTS "idx_platform_renewals_paidAccountId" ON platform_renewals("paidAccountId");
CREATE INDEX IF NOT EXISTS "idx_platform_renewals_paymentId" ON platform_renewals("paymentId");
CREATE INDEX IF NOT EXISTS "idx_platform_renewals_status" ON platform_renewals(status);

-- Verificação: Contar registros (deve retornar 0 inicialmente)
SELECT COUNT(*) as total_platform_renewals FROM platform_renewals;

-- Verificação: Ver estrutura da nova tabela
\d platform_renewals;

-- Verificação: Ver novos campos em clients
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'clients'
  AND column_name IN ('autoRenewalEnabled', 'lastRenewalDate', 'renewalPaymentId');
