import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cpf = searchParams.get("cpf");

    if (!cpf) {
      return Response.json(
        {
          success: false,
          error: "CPF é obrigatório",
        },
        { status: 400 }
      );
    }

    const cleanCpf = cpf.replace(/\D/g, "");

    // ✅ BUSCAR TODAS as avaliações do cliente em todas as tabelas
    const [clients, mgcClients, paidAccountsWithClients] = await Promise.all([
      // 1. Buscar na tabela clients
      prisma.client.findMany({
        where: { cpf: cleanCpf },
        select: {
          id: true,
          name: true,
          cpf: true,
          plan: true,
          platform: true,
          traderStatus: true,
          startDate: true,
          endDate: true,
        },
      }),

      // 2. Buscar na tabela mgcClients
      prisma.mgcClient.findMany({
        where: { cpf: cleanCpf },
        select: {
          id: true,
          name: true,
          cpf: true,
          plan: true,
          platform: true,
          status: true,
          startDate: true,
          endDate: true,
        },
      }),

      // 3. Buscar na tabela paidAccounts através da relação com clients
      prisma.paidAccount.findMany({
        where: {
          client: { cpf: cleanCpf },
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              cpf: true,
              plan: true,
              platform: true,
              traderStatus: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      }),
    ]);

    // ✅ CONSOLIDAR todas as avaliações encontradas
    const allEvaluations: {
      id: string;
      name: string;
      cpf: string;
      plan: string;
      platform: string;
      status: string;
      startDate: Date | null;
      endDate: Date | null;
      source: string;
      displayName: string;
    }[] = [];

    // Adicionar clientes da tabela principal
    clients.forEach((client) => {
      allEvaluations.push({
        id: client.id,
        name: client.name,
        cpf: client.cpf,
        plan: client.plan,
        platform: client.platform,
        status: client.traderStatus,
        startDate: client.startDate,
        endDate: client.endDate,
        source: "evaluation", // Origem: avaliação normal
        displayName: `${client.plan} - ${client.traderStatus}`,
      });
    });

    // Adicionar clientes MGC
    mgcClients.forEach((mgcClient) => {
      allEvaluations.push({
        id: mgcClient.id,
        name: mgcClient.name,
        cpf: mgcClient.cpf,
        plan: mgcClient.plan,
        platform: mgcClient.platform,
        status: mgcClient.status,
        startDate: mgcClient.startDate,
        endDate: mgcClient.endDate,
        source: "mgc", // Origem: cliente MGC
        displayName: `${mgcClient.plan} - ${mgcClient.status}`,
      });
    });

    // Adicionar contas remuneradas
    paidAccountsWithClients.forEach((paidAccount) => {
      allEvaluations.push({
        id: paidAccount.client.id,
        name: paidAccount.client.name,
        cpf: paidAccount.client.cpf,
        plan: paidAccount.plan, // Usar plano da conta remunerada
        platform: paidAccount.platform, // Usar plataforma da conta remunerada
        status: paidAccount.status,
        startDate: paidAccount.startDate,
        endDate: paidAccount.endDate,
        source: "paid", // Origem: conta remunerada
        displayName: `${paidAccount.plan} - Conta Remunerada (${paidAccount.status})`,
      });
    });

    if (allEvaluations.length === 0) {
      return Response.json(
        {
          success: false,
          error: "Cliente não encontrado",
        },
        { status: 404 }
      );
    }

    // ✅ RETORNAR todas as avaliações encontradas
    return Response.json({
      success: true,
      evaluations: allEvaluations,
      multiple: allEvaluations.length > 1, // Indica se há múltiplas avaliações
    });
  } catch (error) {
    console.error("[Operations Analyst] Erro ao buscar cliente:", error);
    return Response.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
