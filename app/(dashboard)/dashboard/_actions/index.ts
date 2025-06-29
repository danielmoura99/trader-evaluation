"use server";

import { prisma } from "@/lib/prisma";
import { TraderStatus } from "@/app/types";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function getDashboardStats() {
  // Total de clientes
  const totalClients = await prisma.client.count();

  // Clientes por status
  const awaitingClients = await prisma.client.count({
    where: { traderStatus: TraderStatus.WAITING },
  });

  const inEvaluationClients = await prisma.client.count({
    where: { traderStatus: TraderStatus.IN_PROGRESS },
  });

  const completedClients = await prisma.client.count({
    where: {
      traderStatus: {
        in: [TraderStatus.APPROVED, TraderStatus.REJECTED],
      },
    },
  });

  // Taxa de aprovação
  const approvedClients = await prisma.client.count({
    where: { traderStatus: TraderStatus.APPROVED },
  });

  // ✅ Clientes diretos (nova métrica separada)
  const directClients = await prisma.client.count({
    where: { traderStatus: TraderStatus.DIRECT },
  });

  const approvalRate =
    completedClients > 0
      ? ((approvedClients / completedClients) * 100).toFixed(1)
      : "0.0";

  const approvalRateByPlan = await prisma.client.groupBy({
    by: ["plan"],
    _count: {
      id: true,
    },
    where: {
      traderStatus: {
        in: [TraderStatus.APPROVED, TraderStatus.REJECTED],
      },
    },
  });

  const approvedByPlan = await prisma.client.groupBy({
    by: ["plan"],
    _count: {
      id: true,
    },
    where: {
      traderStatus: TraderStatus.APPROVED,
    },
  });

  // ✅ NOVA MÉTRICA: Estatísticas de planos diretos por plano
  const directByPlan = await prisma.client.groupBy({
    by: ["plan"],
    _count: {
      id: true,
    },
    where: {
      traderStatus: TraderStatus.DIRECT,
    },
  });

  const planApprovalRates = approvalRateByPlan
    .map((plan) => {
      const totalForPlan = plan._count.id;
      const approvedForPlan =
        approvedByPlan.find((p) => p.plan === plan.plan)?._count.id || 0;

      return {
        plan: plan.plan,
        rate:
          totalForPlan > 0
            ? ((approvedForPlan / totalForPlan) * 100).toFixed(1)
            : "0.0",
        rateNumber:
          totalForPlan > 0 ? (approvedForPlan / totalForPlan) * 100 : 0, // campo adicional para ordenação
      };
    })
    .sort((a, b) => b.rateNumber - a.rateNumber) // Ordena por taxa em ordem decrescente
    .map(({ plan, rate }) => ({ plan, rate })); // Remove o campo auxiliar rateNumber

  // ✅ NOVA ESTATÍSTICA: Evolução mensal separando avaliações de diretos
  const currentMonth = new Date();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const lastMonth = subMonths(currentMonth, 1);

  const monthlyData = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(currentMonth, i);
      const startDate = startOfMonth(month);
      const endDate = endOfMonth(month);

      return Promise.all([
        // Clientes avaliativos criados no mês
        prisma.client.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            traderStatus: {
              in: [
                TraderStatus.WAITING,
                TraderStatus.IN_PROGRESS,
                TraderStatus.APPROVED,
                TraderStatus.REJECTED,
              ],
            },
          },
        }),
        // Clientes diretos criados no mês
        prisma.client.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            traderStatus: TraderStatus.DIRECT,
          },
        }),
        // Aprovações no mês
        prisma.client.count({
          where: {
            endDate: {
              gte: startDate,
              lte: endDate,
            },
            traderStatus: TraderStatus.APPROVED,
          },
        }),
      ]).then(([evaluative, direct, approved]) => ({
        month: month.toISOString(),
        evaluativeClients: evaluative,
        directClients: direct,
        approvedClients: approved,
      }));
    })
  );

  return {
    totalClients,
    awaitingClients,
    inEvaluationClients,
    completedClients, // ✅ Somente avaliações finalizadas
    directClients, // ✅ Nova métrica
    approvalRate,
    planApprovalRates,
    directByPlan: directByPlan.map((plan) => ({
      plan: plan.plan,
      count: plan._count.id,
    })),
    monthlyData: monthlyData.reverse(),
  };
}

export async function getClientsByPlan() {
  const clientsByPlan = await prisma.client.groupBy({
    by: ["plan"],
    _count: {
      plan: true,
    },
  });

  return clientsByPlan.map((item) => ({
    plan: item.plan,
    total: item._count.plan,
  }));
}

export async function getEvaluationsByMonth() {
  // Buscar dados dos últimos 6 meses
  const months = Array.from({ length: 6 })
    .map((_, i) => {
      const date = subMonths(new Date(), i);
      return {
        startDate: startOfMonth(date),
        endDate: endOfMonth(date),
        month: date.getMonth(),
        year: date.getFullYear(),
      };
    })
    .reverse();

  const evaluationsData = await Promise.all(
    months.map(async ({ startDate, endDate }) => {
      const count = await prisma.client.count({
        where: {
          startDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
      return {
        month: startDate.toLocaleString("pt-BR", { month: "short" }),
        total: count,
      };
    })
  );

  return evaluationsData;
}

export async function getRecentClients() {
  return await prisma.client.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    select: {
      id: true,
      name: true,
      platform: true,
      plan: true,
      traderStatus: true,
      createdAt: true,
    },
  });
}
