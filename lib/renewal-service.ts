// lib/renewal-service.ts
// Serviços para gerenciamento de renovações

import { prisma } from "@/lib/prisma";
import { calculateDaysToExpire } from "@/utils/paid-accounts-helper";
import { getPlatformPrice, formatCurrency } from "@/utils/platform-pricing";

/**
 * Interface para status de renovação
 */
export interface RenewalStatus {
  canRenew: boolean;
  daysUntilExpiration: number;
  expirationDate: Date;
  renewalPrice: number;
  renewalPriceFormatted: string;
  platform: string;
  plan: string;
  status: string;
  lastRenewalDate?: Date;
}

/**
 * Interface para dados de renovação
 */
export interface RenewalData {
  paidAccountId: string;
  clientName: string;
  clientEmail: string;
  platform: string;
  amount: number;
  metadata: {
    type: "renewal";
    paidAccountId: string;
    platform: string;
  };
}

/**
 * Verificar se uma conta pode ser renovada
 * @param paidAccountId ID da conta remunerada
 * @returns Status de renovação ou null se conta não encontrada
 */
export async function checkRenewalStatus(
  paidAccountId: string
): Promise<RenewalStatus | null> {
  const paidAccount = await prisma.paidAccount.findUnique({
    where: { id: paidAccountId },
    include: {
      client: {
        select: {
          name: true,
          email: true,
        },
      },
      renewals: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (
    !paidAccount ||
    paidAccount.status !== "Ativo" ||
    !paidAccount.startDate
  ) {
    return null;
  }

  // Calcular dias até vencimento
  const daysUntilExpiration = calculateDaysToExpire(paidAccount.startDate, 30);

  // Verificar se pode renovar (3 dias antes ou já vencido)
  const canRenew = daysUntilExpiration <= 3;

  // Obter preço da plataforma
  const renewalPrice = getPlatformPrice(paidAccount.platform);
  if (!renewalPrice) {
    throw new Error(
      `Preço não encontrado para plataforma: ${paidAccount.platform}`
    );
  }

  // Data de vencimento
  const expirationDate = new Date(paidAccount.startDate);
  expirationDate.setDate(expirationDate.getDate() + 30);

  return {
    canRenew,
    daysUntilExpiration,
    expirationDate,
    renewalPrice,
    renewalPriceFormatted: formatCurrency(renewalPrice),
    platform: paidAccount.platform,
    plan: paidAccount.plan,
    status: paidAccount.status,
    lastRenewalDate: paidAccount.renewals[0]?.renewalDate,
  };
}

/**
 * Preparar dados para gerar cobrança de renovação
 * @param paidAccountId ID da conta remunerada
 * @returns Dados necessários para gerar checkout ou null se inválido
 */
export async function prepareRenewalData(
  paidAccountId: string
): Promise<RenewalData | null> {
  const renewalStatus = await checkRenewalStatus(paidAccountId);

  if (!renewalStatus || !renewalStatus.canRenew) {
    return null;
  }

  const paidAccount = await prisma.paidAccount.findUnique({
    where: { id: paidAccountId },
    include: {
      client: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!paidAccount) {
    return null;
  }

  return {
    paidAccountId,
    clientName: paidAccount.client.name,
    clientEmail: paidAccount.client.email,
    platform: paidAccount.platform,
    amount: renewalStatus.renewalPrice,
    metadata: {
      type: "renewal",
      paidAccountId,
      platform: paidAccount.platform,
    },
  };
}

/**
 * Criar registro de renovação pendente
 * @param paidAccountId ID da conta remunerada
 * @param paymentId ID do pagamento no gateway
 * @param amount Valor em centavos
 * @param platform Nome da plataforma
 * @returns ID do registro de renovação criado
 */
export async function createPendingRenewal(
  paidAccountId: string,
  paymentId: string,
  amount: number,
  platform: string
): Promise<string> {
  const renewal = await prisma.accountRenewal.create({
    data: {
      paidAccountId,
      paymentId,
      renewalDate: new Date(),
      amount,
      platform,
      status: "pending",
    },
  });

  return renewal.id;
}

/**
 * Processar renovação confirmada
 * @param paymentId ID do pagamento confirmado
 * @returns true se processado com sucesso
 */
export async function processConfirmedRenewal(
  paymentId: string
): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx) => {
      // Buscar renovação pendente
      const renewal = await tx.accountRenewal.findFirst({
        where: {
          paymentId,
          status: "pending",
        },
        include: {
          paidAccount: true,
        },
      });

      if (!renewal) {
        throw new Error(
          `Renovação não encontrada para payment ID: ${paymentId}`
        );
      }

      // Atualizar status da renovação
      await tx.accountRenewal.update({
        where: { id: renewal.id },
        data: {
          status: "completed",
          renewalDate: new Date(),
        },
      });

      // Renovar a conta: nova data de ativação (+30 dias a partir de hoje)
      const newStartDate = new Date();

      await tx.paidAccount.update({
        where: { id: renewal.paidAccountId },
        data: {
          startDate: newStartDate,
          endDate: null, // Remover data de cancelamento se existir
          status: "Ativo", // Garantir que está ativa
        },
      });
    });

    return true;
  } catch (error) {
    console.error("Erro ao processar renovação:", error);
    return false;
  }
}

/**
 * Obter histórico de renovações de uma conta
 * @param paidAccountId ID da conta remunerada
 * @returns Array com histórico de renovações
 */
export async function getRenewalHistory(paidAccountId: string) {
  return await prisma.accountRenewal.findMany({
    where: { paidAccountId },
    orderBy: { createdAt: "desc" },
  });
}
