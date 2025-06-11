// app/(dashboard)/paid-accounts/_actions/index.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaidAccountStatus } from "@/app/types";

export async function getPaidAccounts() {
  return await prisma.paidAccount.findMany({
    include: {
      client: {
        select: {
          name: true,
          email: true,
          cpf: true,
          birthDate: true,
          startDate: true, // ✅ Data de início do cliente (do formulário)
        },
      },
    },
    orderBy: [
      // ✅ NOVA ORDENAÇÃO: Primeiro por status (Aguardando primeiro)
      {
        status: "asc", // "Aguardando" vem antes de "Ativo" e "Cancelado" alfabeticamente
      },
      // ✅ Depois por data de início do cliente (mais antigos primeiro)
      {
        client: {
          startDate: "asc", // Datas mais antigas primeiro (NULLS LAST automaticamente)
        },
      },
      // ✅ Fallback: Por data de criação da conta remunerada
      {
        createdAt: "desc",
      },
    ],
  });
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
        plan: data.plan, // ✅ Sincronizar plano entre as tabelas
        platform: data.platform, // ✅ Sincronizar plataforma entre as tabelas
      },
    });
  });

  revalidatePath("/paid-accounts");
}
