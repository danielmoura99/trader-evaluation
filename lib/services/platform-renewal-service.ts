/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/services/platform-renewal-service.ts
// Serviço unificado para gerenciamento de renovações de plataforma
// Suporta tanto Client (em avaliação) quanto PaidAccount (conta remunerada)

import { prisma } from "@/lib/prisma";
import { calculateDaysToExpire } from "@/utils/paid-accounts-helper";
import { getPlatformPrice, formatCurrency } from "@/utils/platform-pricing";

/**
 * Tipo de renovação
 */
export type RenewalType = "evaluation" | "paid_account";

/**
 * Interface para status de renovação
 */
export interface PlatformRenewalStatus {
  canRenew: boolean;
  daysUntilExpiration: number;
  expirationDate: Date;
  renewalPrice: number;
  renewalPriceFormatted: string;
  platform: string;
  plan: string;
  status: string;
  renewalType: RenewalType;
  lastRenewalDate?: Date;
  entityId: string; // clientId ou paidAccountId
}

/**
 * Interface para dados de renovação
 */
export interface PlatformRenewalData {
  entityId: string; // clientId ou paidAccountId
  renewalType: RenewalType;
  customerName: string;
  customerEmail: string;
  customerCpf: string;
  platform: string;
  amount: number;
  metadata: {
    type: "platform_renewal";
    renewalType: RenewalType;
    entityId: string;
    platform: string;
  };
}

/**
 * Verificar se um Client (em avaliação) pode ser renovado
 */
export async function checkClientRenewalStatus(
  clientId: string
): Promise<PlatformRenewalStatus | null> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      platformRenewals: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Só permite renovação se estiver "Em Avaliação" ou "Aprovado"
  if (
    !client ||
    client.traderStatus === "Reprovado" ||
    !client.platformStartDate
  ) {
    return null;
  }

  // Calcular dias desde a última ativação da plataforma
  const daysUntilExpiration = calculateDaysToExpire(
    client.platformStartDate,
    30
  );

  // Verificar se pode renovar (3 dias antes ou já vencido)
  const canRenew = daysUntilExpiration <= 3;

  // Obter preço da plataforma
  const renewalPrice = getPlatformPrice(client.platform);
  if (!renewalPrice) {
    throw new Error(`Preço não encontrado para plataforma: ${client.platform}`);
  }

  // Data de vencimento da plataforma
  const expirationDate = new Date(client.platformStartDate);
  expirationDate.setDate(expirationDate.getDate() + 30);

  return {
    canRenew,
    daysUntilExpiration,
    expirationDate,
    renewalPrice,
    renewalPriceFormatted: formatCurrency(renewalPrice),
    platform: client.platform,
    plan: client.plan,
    status: client.traderStatus,
    renewalType: "evaluation",
    lastRenewalDate: client.platformRenewals[0]?.renewalDate,
    entityId: clientId,
  };
}

/**
 * Verificar se uma PaidAccount pode ser renovada
 */
export async function checkPaidAccountRenewalStatus(
  paidAccountId: string
): Promise<PlatformRenewalStatus | null> {
  const paidAccount = await prisma.paidAccount.findUnique({
    where: { id: paidAccountId },
    include: {
      platformRenewals: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Só permite renovação se status for "Ativo"
  if (
    !paidAccount ||
    paidAccount.status !== "Ativo" ||
    !paidAccount.startDate
  ) {
    return null;
  }

  // Calcular dias desde a última ativação (startDate = Data Ativação)
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

  // Data de vencimento (30 dias desde startDate)
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
    renewalType: "paid_account",
    lastRenewalDate: paidAccount.platformRenewals[0]?.renewalDate,
    entityId: paidAccountId,
  };
}

/**
 * Preparar dados para gerar cobrança de renovação (Client)
 */
export async function prepareClientRenewalData(
  clientId: string
): Promise<PlatformRenewalData | null> {
  const renewalStatus = await checkClientRenewalStatus(clientId);

  if (!renewalStatus || !renewalStatus.canRenew) {
    return null;
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client) {
    return null;
  }

  return {
    entityId: clientId,
    renewalType: "evaluation",
    customerName: client.name,
    customerEmail: client.email,
    customerCpf: client.cpf,
    platform: client.platform,
    amount: renewalStatus.renewalPrice,
    metadata: {
      type: "platform_renewal",
      renewalType: "evaluation",
      entityId: clientId,
      platform: client.platform,
    },
  };
}

/**
 * Preparar dados para gerar cobrança de renovação (PaidAccount)
 */
export async function preparePaidAccountRenewalData(
  paidAccountId: string
): Promise<PlatformRenewalData | null> {
  const renewalStatus = await checkPaidAccountRenewalStatus(paidAccountId);

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
          cpf: true,
        },
      },
    },
  });

  if (!paidAccount) {
    return null;
  }

  return {
    entityId: paidAccountId,
    renewalType: "paid_account",
    customerName: paidAccount.client.name,
    customerEmail: paidAccount.client.email,
    customerCpf: paidAccount.client.cpf,
    platform: paidAccount.platform,
    amount: renewalStatus.renewalPrice,
    metadata: {
      type: "platform_renewal",
      renewalType: "paid_account",
      entityId: paidAccountId,
      platform: paidAccount.platform,
    },
  };
}

/**
 * Criar registro de renovação pendente
 */
export async function createPendingPlatformRenewal(
  renewalData: PlatformRenewalData,
  paymentId: string,
  pixCode?: string,
  pixExpiresAt?: Date
): Promise<string> {
  const data: any = {
    renewalType: renewalData.renewalType,
    paymentId,
    renewalDate: new Date(),
    amount: renewalData.amount,
    platform: renewalData.platform,
    status: "pending",
    pixCode,
    pixExpiresAt,
  };

  // Conectar ao Client ou PaidAccount
  if (renewalData.renewalType === "evaluation") {
    data.clientId = renewalData.entityId;
  } else {
    data.paidAccountId = renewalData.entityId;
  }

  const renewal = await prisma.platformRenewal.create({
    data,
  });

  // Atualizar renewalPaymentId na entidade correspondente
  if (renewalData.renewalType === "evaluation") {
    await prisma.client.update({
      where: { id: renewalData.entityId },
      data: { renewalPaymentId: paymentId },
    });
  } else {
    await prisma.paidAccount.update({
      where: { id: renewalData.entityId },
      data: { renewalPaymentId: paymentId },
    });
  }

  return renewal.id;
}

/**
 * Processar renovação confirmada
 */
export async function processConfirmedPlatformRenewal(
  paymentId: string
): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx) => {
      // Buscar renovação pendente
      const renewal = await tx.platformRenewal.findFirst({
        where: {
          paymentId,
          status: "pending",
        },
      });

      if (!renewal) {
        throw new Error(
          `Renovação não encontrada para payment ID: ${paymentId}`
        );
      }

      // Atualizar status da renovação
      await tx.platformRenewal.update({
        where: { id: renewal.id },
        data: {
          status: "completed",
          renewalDate: new Date(),
        },
      });

      const newStartDate = new Date();

      // Renovar plataforma do Client ou PaidAccount
      if (renewal.renewalType === "evaluation" && renewal.clientId) {
        // Client usa platformStartDate
        await tx.client.update({
          where: { id: renewal.clientId },
          data: {
            platformStartDate: newStartDate,
            lastRenewalDate: new Date(),
            renewalPaymentId: null,
          },
        });
      } else if (
        renewal.renewalType === "paid_account" &&
        renewal.paidAccountId
      ) {
        // PaidAccount usa startDate (Data Ativação)
        await tx.paidAccount.update({
          where: { id: renewal.paidAccountId },
          data: {
            startDate: newStartDate,
            status: "Ativo",
            lastRenewalDate: new Date(),
            renewalPaymentId: null,
          },
        });
      }
    });

    return true;
  } catch (error) {
    console.error("Erro ao processar renovação:", error);
    return false;
  }
}

/**
 * Obter histórico de renovações
 */
export async function getPlatformRenewalHistory(
  entityId: string,
  renewalType: RenewalType
) {
  const where =
    renewalType === "evaluation"
      ? { clientId: entityId }
      : { paidAccountId: entityId };

  return await prisma.platformRenewal.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Buscar renovação pendente por PIX
 */
export async function findPendingRenewalByPaymentId(paymentId: string) {
  return await prisma.platformRenewal.findFirst({
    where: {
      paymentId,
      status: "pending",
    },
    include: {
      client: true,
      paidAccount: {
        include: {
          client: true,
        },
      },
    },
  });
}
