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
  // Calculando a data de fim (60 dias após o início)
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 60);

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
