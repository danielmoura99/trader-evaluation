"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaidAccountStatus, TraderStatus } from "@/app/types";

export async function getAwaitingClients() {
  return await prisma.client.findMany({
    where: {
      traderStatus: TraderStatus.WAITING,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getEvaluationClients() {
  return await prisma.client.findMany({
    where: {
      traderStatus: TraderStatus.IN_PROGRESS,
    },
    orderBy: {
      startDate: "asc",
    },
  });
}

export async function startEvaluation(clientId: string) {
  const startDate = new Date();

  // Buscar o cliente para verificar o plano
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { plan: true },
  });

  if (!client) {
    throw new Error("Cliente não encontrado");
  }

  // Calcular a data de fim baseada no plano
  const endDate = new Date(startDate);

  if (client.plan === "TC - 50K") {
    // Para o plano TC - 50K: 30 dias
    endDate.setDate(endDate.getDate() + 30);
  } else {
    // Para todos os outros planos: 60 dias (padrão atual)
    endDate.setDate(endDate.getDate() + 30);
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      traderStatus: TraderStatus.IN_PROGRESS,
      startDate,
      endDate,
    },
  });
  revalidatePath("/evaluations");
}

export async function finishEvaluation(
  clientId: string,
  status: "Aprovado" | "Reprovado"
) {
  await prisma.client.update({
    where: { id: clientId },
    data: {
      traderStatus:
        status === "Aprovado" ? TraderStatus.APPROVED : TraderStatus.REJECTED,
      endDate: new Date(),
      cancellationDate: new Date(),
    },
  });

  // Se foi aprovado, criar PaidAccount
  if (status === "Aprovado") {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (client) {
      await prisma.paidAccount.create({
        data: {
          clientId,
          platform: client.platform,
          plan: client.plan,
          status: PaidAccountStatus.WAITING,
        },
      });
    }
  }

  revalidatePath("/evaluations");
  revalidatePath("/paid-accounts");
}
