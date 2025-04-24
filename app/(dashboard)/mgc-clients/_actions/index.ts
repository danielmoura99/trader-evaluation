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

export async function cancelMgcClient(
  id: string,
  reason: "Cancelado" | "Reprovado"
) {
  // Buscar dados do cliente MGC para uso posterior, se necessário
  const client = await prisma.mgcClient.findUnique({
    where: { id },
  });

  if (!client) {
    throw new Error("Cliente MGC não encontrado");
  }

  // Atualizar o status do cliente MGC para cancelado
  await prisma.mgcClient.update({
    where: { id },
    data: {
      status: "Cancelado",
      endDate: new Date(),
    },
  });

  // Se o motivo for "Reprovado", criar um contato na tabela de contacts
  if (reason === "Reprovado") {
    // Primeiro, precisamos verificar se já existe um cliente na tabela clients com este CPF
    let clientId: string;

    const existingClient = await prisma.client.findFirst({
      where: { cpf: client.cpf },
    });

    if (existingClient) {
      // Se já existe um cliente, usamos o ID dele
      clientId = existingClient.id;
    } else {
      // Se não existe, criamos um novo cliente na tabela clients
      const newClient = await prisma.client.create({
        data: {
          name: client.name,
          cpf: client.cpf,
          phone: client.phone,
          birthDate: client.birthDate,
          address: client.address || "",
          zipCode: client.zipCode || "",
          email: client.email,
          platform: client.platform,
          plan: client.plan,
          traderStatus: "Reprovado", // Marcamos como reprovado
          startDate: client.startDate,
          endDate: client.endDate,
          cancellationDate: new Date(),
          observation: client.observation || "Cliente MGT reprovado",
        },
      });

      clientId = newClient.id;
    }

    // Agora criamos o contato na tabela contacts
    await prisma.contact.create({
      data: {
        clientId,
        status: "Sem contato",
        date: new Date(),
        notes: "Sem Contato",
        createdAt: new Date(),
      },
    });

    console.log(
      `Cliente MGT ${id} reprovado e adicionado à lista de contatos.`
    );
  }

  revalidatePath("/mgc-clients");
  if (reason === "Reprovado") {
    revalidatePath("/reproved"); // Revalidar a página de reprovados também
  }
}

export async function updateMgcClient(
  id: string,
  data: {
    platform?: string;
    plan?: string;
    observation?: string;
    startDate?: Date | null;
    endDate?: Date | null;
    status?: string;
  }
) {
  await prisma.mgcClient.update({
    where: { id },
    data,
  });
  revalidatePath("/mgc-clients");
}

export async function deleteMgcClient(id: string) {
  await prisma.mgcClient.delete({
    where: { id },
  });
  revalidatePath("/mgc-clients");
}
