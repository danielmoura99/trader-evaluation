"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMgcClients() {
  // Primeiro recuperamos todos os clientes
  const clients = await prisma.mgcClient.findMany();

  // Agora vamos ordenar por data de vencimento para clientes ativos
  // Isso é um backup para a ordenação que também acontece no cliente via TanStack Table
  return clients.sort((a, b) => {
    // Coloca ativos primeiro, e entre os ativos, os que vão expirar primeiro
    if (a.status === "Ativo" && b.status !== "Ativo") return -1;
    if (a.status !== "Ativo" && b.status === "Ativo") return 1;

    // Se ambos são ativos, ordenar por data de vencimento
    if (a.status === "Ativo" && b.status === "Ativo") {
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;

      // Calcular datas de vencimento (startDate + 30 dias)
      const aDate = new Date(a.startDate);
      const bDate = new Date(b.startDate);

      // Compara pela data de vencimento
      return aDate.getTime() - bDate.getTime();
    }

    // Para não ativos, manter ordenação padrão por data de criação
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
    startDate?: Date | null;
  }
) {
  await prisma.mgcClient.update({
    where: { id },
    data,
  });
  revalidatePath("/mgc-clients");
}
