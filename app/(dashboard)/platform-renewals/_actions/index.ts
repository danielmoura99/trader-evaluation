/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(dashboard)/platform-renewals/_actions/index.ts
"use server";

import { prisma } from "@/lib/prisma";

export async function getPlatformRenewals(filters?: {
  status?: string;
  renewalType?: string;
}) {
  const where: any = {};

  if (filters?.status && filters.status !== "all") {
    where.status = filters.status;
  }

  if (filters?.renewalType && filters.renewalType !== "all") {
    where.renewalType = filters.renewalType;
  }

  const renewals = await prisma.platformRenewal.findMany({
    where,
    include: {
      client: {
        select: {
          name: true,
          email: true,
          cpf: true,
          phone: true,
          platform: true,
          plan: true,
          traderStatus: true,
          platformStartDate: true,
          lastRenewalDate: true,
        },
      },
      paidAccount: {
        select: {
          platform: true,
          plan: true,
          status: true,
          startDate: true,
          lastRenewalDate: true,
          client: {
            select: {
              name: true,
              email: true,
              cpf: true,
              phone: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  // Formatar dados para a tabela
  return renewals.map((renewal) => {
    const customer =
      renewal.renewalType === "evaluation"
        ? renewal.client
        : renewal.paidAccount?.client;

    return {
      id: renewal.id,
      renewalType: renewal.renewalType,
      paymentId: renewal.paymentId,
      amount: renewal.amount,
      platform: renewal.platform,
      status: renewal.status,
      renewalDate: renewal.renewalDate,
      pixCode: renewal.pixCode,
      pixExpiresAt: renewal.pixExpiresAt,
      createdAt: renewal.createdAt,
      updatedAt: renewal.updatedAt,
      customer: {
        name: customer?.name || "N/A",
        email: customer?.email || "N/A",
        cpf: customer?.cpf || "N/A",
        phone: customer?.phone || "N/A",
      },
      entity:
        renewal.renewalType === "evaluation"
          ? {
              platform: renewal.client?.platform,
              plan: renewal.client?.plan,
              traderStatus: renewal.client?.traderStatus,
              platformStartDate: renewal.client?.platformStartDate,
              lastRenewalDate: renewal.client?.lastRenewalDate,
            }
          : {
              platform: renewal.paidAccount?.platform,
              plan: renewal.paidAccount?.plan,
              status: renewal.paidAccount?.status,
              startDate: renewal.paidAccount?.startDate,
              lastRenewalDate: renewal.paidAccount?.lastRenewalDate,
            },
    };
  });
}

export async function getRenewalStats() {
  const stats = await prisma.platformRenewal.groupBy({
    by: ["status"],
    _count: true,
    _sum: {
      amount: true,
    },
  });

  return stats.map((stat) => ({
    status: stat.status,
    count: stat._count,
    totalAmount: stat._sum.amount || 0,
  }));
}

export async function completePlatformRenewal(renewalId: string) {
  const renewal = await prisma.platformRenewal.findUnique({
    where: { id: renewalId },
    select: {
      renewalType: true,
      clientId: true,
      paidAccountId: true,
      status: true,
    },
  });

  if (!renewal) {
    throw new Error("Renovação não encontrada");
  }

  if (renewal.status !== "paid") {
    throw new Error("Renovação não está no status 'paid'");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Atualizar status da renovação para "completed"
    await tx.platformRenewal.update({
      where: { id: renewalId },
      data: {
        status: "completed",
        updatedAt: new Date(),
      },
    });

    const newStartDate = new Date(); // Nova data de início = HOJE

    // 2. Renovar plataforma do Client ou PaidAccount
    if (renewal.renewalType === "evaluation" && renewal.clientId) {
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
}
