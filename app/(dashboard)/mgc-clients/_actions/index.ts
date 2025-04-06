"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMgcClients() {
  return await prisma.mgcClient.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function activateMgcClient(id: string) {
  const startDate = new Date();

  await prisma.mgcClient.update({
    where: { id },
    data: {
      status: "Ativo",
      startDate,
    },
  });
  revalidatePath("/mgc-clients");
}

export async function createMgcClient(data: {
  name: string;
  cpf: string;
  phone: string;
  email: string;
  birthDate: Date;
  address?: string;
  zipCode?: string;
  platform: string;
  plan: string;
  observation?: string;
}) {
  await prisma.mgcClient.create({
    data: {
      ...data,
      status: "Aguardando",
    },
  });
  revalidatePath("/mgc-clients");
}

export async function cancelMgcClient(id: string) {
  await prisma.mgcClient.update({
    where: { id },
    data: {
      status: "Cancelado",
      endDate: new Date(),
    },
  });
  revalidatePath("/mgc-clients");
}

export async function updateMgcClient(
  id: string,
  data: {
    platform?: string;
    plan?: string;
    observation?: string;
  }
) {
  await prisma.mgcClient.update({
    where: { id },
    data,
  });
  revalidatePath("/mgc-clients");
}
