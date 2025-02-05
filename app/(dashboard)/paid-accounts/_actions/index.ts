"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaidAccountStatus } from "@/app/types";

export async function getPaidAccounts() {
  return await prisma.paidAccount.findMany({
    include: {
      client: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function activatePaidAccount(id: string) {
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
  }
) {
  await prisma.paidAccount.update({
    where: { id },
    data,
  });
  revalidatePath("/paid-accounts");
}
