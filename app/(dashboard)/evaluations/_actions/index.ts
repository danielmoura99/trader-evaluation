"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaidAccountStatus, TraderStatus } from "@/app/types";
import { requireAuthenticatedSession } from "@/lib/security";

export async function getAwaitingClients() {
  await requireAuthenticatedSession();

  return prisma.client.findMany({
    where: {
      traderStatus: TraderStatus.WAITING,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getEvaluationClients() {
  await requireAuthenticatedSession();

  return prisma.client.findMany({
    where: {
      traderStatus: TraderStatus.IN_PROGRESS,
    },
    orderBy: {
      startDate: "asc",
    },
  });
}

export async function startEvaluation(clientId: string) {
  await requireAuthenticatedSession();

  const startDate = new Date();
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { plan: true },
  });

  if (!client) {
    throw new Error("Cliente nao encontrado");
  }

  const endDate = new Date(startDate);

  if (client.plan === "TC - 50K") {
    endDate.setDate(endDate.getDate() + 30);
  } else {
    endDate.setDate(endDate.getDate() + 30);
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      traderStatus: TraderStatus.IN_PROGRESS,
      startDate,
      endDate,
      platformStartDate: startDate,
    },
  });
  revalidatePath("/evaluations");
}

export async function finishEvaluation(
  clientId: string,
  status: "Aprovado" | "Reprovado"
) {
  await requireAuthenticatedSession();

  await prisma.client.update({
    where: { id: clientId },
    data: {
      traderStatus:
        status === "Aprovado" ? TraderStatus.APPROVED : TraderStatus.REJECTED,
      endDate: new Date(),
      cancellationDate: new Date(),
    },
  });

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
