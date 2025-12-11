// app/(dashboard)/paid-accounts/_actions/index.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaidAccountStatus } from "@/app/types";

export async function getPaidAccounts() {
  const accounts = await prisma.paidAccount.findMany({
    include: {
      client: {
        select: {
          name: true,
          email: true,
          cpf: true,
          birthDate: true,
          startDate: true, // Data de início do cliente (do formulário)
          observation: true, // Campo observação
        },
      },
    },
  });

  // ✅ NOVA LÓGICA: Ordenação inteligente com prioridade para vencimento
  return accounts.sort((a, b) => {
    // 1. PRIMEIRO: Contas "Aguardando" sempre no topo
    if (a.status === "Aguardando" && b.status !== "Aguardando") return -1;
    if (b.status === "Aguardando" && a.status !== "Aguardando") return 1;

    // 2. SEGUNDO: Contas "Ativo" ordenadas por proximidade do vencimento
    if (a.status === "Ativo" && b.status === "Ativo") {
      if (a.startDate && b.startDate) {
        // Calcular dias para vencer para ambas
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

        // Contas mais próximas do vencimento primeiro
        return aDaysToExpire - bDaysToExpire;
      }
    }

    // 3. TERCEIRO: Separar "Ativo" de "Cancelado"
    if (a.status === "Ativo" && b.status === "Cancelado") return -1;
    if (b.status === "Ativo" && a.status === "Cancelado") return 1;

    // 4. QUARTO: Contas "Cancelado" por data de cancelamento (mais recentes primeiro)
    if (a.status === "Cancelado" && b.status === "Cancelado") {
      if (a.endDate && b.endDate) {
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      }
    }

    // 5. Fallback: Por data de início do cliente (mais antigos primeiro)
    if (a.client.startDate && b.client.startDate) {
      return (
        new Date(a.client.startDate).getTime() -
        new Date(b.client.startDate).getTime()
      );
    }

    // 6. Último fallback: Por data de criação
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// ✅ NOVA: Buscar contas com status "Aguardando"
export async function getWaitingAccounts() {
  const accounts = await prisma.paidAccount.findMany({
    where: {
      status: "Aguardando",
    },
    include: {
      client: {
        select: {
          name: true,
          email: true,
          cpf: true,
          birthDate: true,
          startDate: true,
          observation: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc", // Mais recentes primeiro
    },
  });

  return accounts;
}

// ✅ NOVA: Buscar contas "Ativo" e "Aguardando Pagamento" ordenadas por vencimento
export async function getActiveAccounts() {
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
          birthDate: true,
          startDate: true,
          observation: true,
        },
      },
    },
  });

  // Ordenação: "Aguardando Pagamento" primeiro, depois "Ativo" por dias a vencer
  return accounts.sort((a, b) => {
    // 1. "Aguardando Pagamento" sempre na frente
    if (
      a.status === "Aguardando Pagamento" &&
      b.status !== "Aguardando Pagamento"
    )
      return -1;
    if (
      b.status === "Aguardando Pagamento" &&
      a.status !== "Aguardando Pagamento"
    )
      return 1;

    // 2. Se ambos são "Ativo", ordenar por dias a vencer
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

    // 3. Fallback: Por data de criação
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// ✅ NOVA: Buscar contas canceladas ordenadas por data de cancelamento
export async function getCancelledAccounts() {
  const accounts = await prisma.paidAccount.findMany({
    where: {
      status: "Cancelado",
    },
    include: {
      client: {
        select: {
          name: true,
          email: true,
          cpf: true,
          birthDate: true,
          startDate: true,
          observation: true,
        },
      },
    },
    orderBy: {
      endDate: "desc", // Mais recentemente canceladas primeiro
    },
  });

  return accounts;
}

export async function activatePaidAccount(id: string) {
  const startDate = new Date();

  await prisma.paidAccount.update({
    where: { id },
    data: {
      status: "Ativo",
      startDate, // ✅ Esta é a data de ativação da conta na plataforma
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
    // Dados da conta remunerada
    platform: string;
    plan: string;
    status: string;
    startDate?: Date | null;
    endDate?: Date | null;

    // Dados do cliente
    clientName: string;
    clientEmail: string;
    clientStartDate?: Date | null;
    clientObservation?: string;
  }
) {
  // ✅ Buscar a conta remunerada para obter o clientId
  const paidAccount = await prisma.paidAccount.findUnique({
    where: { id },
    select: { clientId: true },
  });

  if (!paidAccount) {
    throw new Error("Conta remunerada não encontrada");
  }

  // ✅ Usar transação para atualizar ambas as tabelas atomicamente
  await prisma.$transaction(async (tx) => {
    // Atualizar dados da conta remunerada
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

    // Atualizar dados do cliente
    await tx.client.update({
      where: { id: paidAccount.clientId },
      data: {
        name: data.clientName,
        email: data.clientEmail,
        startDate: data.clientStartDate,
        observation: data.clientObservation,
        plan: data.plan, // ✅ Sincronizar plano entre as tabelas
        platform: data.platform, // ✅ Sincronizar plataforma entre as tabelas
      },
    });
  });

  revalidatePath("/paid-accounts");
}
