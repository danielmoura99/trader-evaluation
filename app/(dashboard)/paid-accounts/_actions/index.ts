"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaidAccountStatus } from "@/app/types";
import { requireAuthenticatedSession } from "@/lib/security";

export async function getPaidAccounts() {
  await requireAuthenticatedSession();

  const accounts = await prisma.paidAccount.findMany({
    include: {
      client: {
        select: {
          name: true,
          email: true,
          cpf: true,
          phone: true,
          birthDate: true,
          startDate: true,
          observation: true,
        },
      },
    },
  });

  return accounts.sort((a, b) => {
    if (a.status === "Aguardando" && b.status !== "Aguardando") return -1;
    if (b.status === "Aguardando" && a.status !== "Aguardando") return 1;

    if (a.status === "Ativo" && b.status === "Ativo") {
      if (a.startDate && b.startDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const aExpiration = new Date(a.startDate);
        aExpiration.setDate(aExpiration.getDate() + 30);
        aExpiration.setHours(0, 0, 0, 0);

        const bExpiration = new Date(b.startDate);
        bExpiration.setDate(bExpiration.getDate() + 30);
        bExpiration.setHours(0, 0, 0, 0);

        const aDaysToExpire = Math.ceil(
          (aExpiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        const bDaysToExpire = Math.ceil(
          (bExpiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        return aDaysToExpire - bDaysToExpire;
      }
    }

    if (a.status === "Ativo" && b.status === "Cancelado") return -1;
    if (b.status === "Ativo" && a.status === "Cancelado") return 1;

    if (a.status === "Cancelado" && b.status === "Cancelado") {
      if (a.endDate && b.endDate) {
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      }
    }

    if (a.client.startDate && b.client.startDate) {
      return (
        new Date(a.client.startDate).getTime() -
        new Date(b.client.startDate).getTime()
      );
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function getWaitingAccounts() {
  await requireAuthenticatedSession();

  return prisma.paidAccount.findMany({
    where: {
      status: "Aguardando",
    },
    include: {
      client: {
        select: {
          name: true,
          email: true,
          cpf: true,
          phone: true,
          birthDate: true,
          startDate: true,
          observation: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getActiveAccounts() {
  await requireAuthenticatedSession();

  const accounts = await prisma.paidAccount.findMany({
    where: {
      status: {
        in: ["Ativo", "Aguardando Pagamento"],
      },
    },
    include: {
      client: {
        select: {
          name: true,
          email: true,
          cpf: true,
          phone: true,
          birthDate: true,
          startDate: true,
          observation: true,
        },
      },
    },
  });

  return accounts.sort((a, b) => {
    if (
      a.status === "Aguardando Pagamento" &&
      b.status !== "Aguardando Pagamento"
    ) {
      return -1;
    }
    if (
      b.status === "Aguardando Pagamento" &&
      a.status !== "Aguardando Pagamento"
    ) {
      return 1;
    }

    if (a.status === "Ativo" && b.status === "Ativo") {
      if (a.startDate && b.startDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const aExpiration = new Date(a.startDate);
        aExpiration.setDate(aExpiration.getDate() + 30);
        aExpiration.setHours(0, 0, 0, 0);

        const bExpiration = new Date(b.startDate);
        bExpiration.setDate(bExpiration.getDate() + 30);
        bExpiration.setHours(0, 0, 0, 0);

        const aDaysToExpire = Math.ceil(
          (aExpiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        const bDaysToExpire = Math.ceil(
          (bExpiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        return aDaysToExpire - bDaysToExpire;
      }
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function getCancelledAccounts() {
  await requireAuthenticatedSession();

  return prisma.paidAccount.findMany({
    where: {
      status: "Cancelado",
    },
    include: {
      client: {
        select: {
          name: true,
          email: true,
          cpf: true,
          phone: true,
          birthDate: true,
          startDate: true,
          observation: true,
        },
      },
    },
    orderBy: {
      endDate: "desc",
    },
  });
}

export async function activatePaidAccount(id: string) {
  await requireAuthenticatedSession();

  const startDate = new Date();

  await prisma.paidAccount.update({
    where: { id },
    data: {
      status: "Ativo",
      startDate,
    },
  });
  revalidatePath("/paid-accounts");
}

export async function createPaidAccount(
  clientId: string,
  platform: string,
  plan: string
) {
  await requireAuthenticatedSession();

  await prisma.paidAccount.create({
    data: {
      clientId,
      platform,
      plan,
      status: "Aguardando",
    },
  });
  revalidatePath("/paid-accounts");
}

export async function cancelPaidAccount(id: string) {
  await requireAuthenticatedSession();

  await prisma.paidAccount.update({
    where: { id },
    data: {
      status: PaidAccountStatus.CANCELLED,
      endDate: new Date(),
    },
  });
  revalidatePath("/paid-accounts");
}

export async function updatePaidAccount(
  id: string,
  data: {
    platform: string;
    plan: string;
    status: string;
    startDate?: Date | null;
    endDate?: Date | null;
    clientName: string;
    clientEmail: string;
    clientStartDate?: Date | null;
    clientObservation?: string;
  }
) {
  await requireAuthenticatedSession();

  const paidAccount = await prisma.paidAccount.findUnique({
    where: { id },
    select: { clientId: true },
  });

  if (!paidAccount) {
    throw new Error("Conta remunerada nao encontrada");
  }

  await prisma.$transaction(async (tx) => {
    await tx.paidAccount.update({
      where: { id },
      data: {
        platform: data.platform,
        plan: data.plan,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });

    await tx.client.update({
      where: { id: paidAccount.clientId },
      data: {
        name: data.clientName,
        email: data.clientEmail,
        startDate: data.clientStartDate,
        observation: data.clientObservation,
        plan: data.plan,
        platform: data.platform,
      },
    });
  });

  revalidatePath("/paid-accounts");
}
