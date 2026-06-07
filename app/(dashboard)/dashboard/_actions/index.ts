"use server";

import { prisma } from "@/lib/prisma";
import { TraderStatus } from "@/app/types";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { requireAuthenticatedSession } from "@/lib/security";

export async function getDashboardStats() {
  await requireAuthenticatedSession();

  const totalClients = await prisma.client.count();
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
  const approvedClients = await prisma.client.count({
    where: { traderStatus: TraderStatus.APPROVED },
  });
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
          totalForPlan > 0 ? (approvedForPlan / totalForPlan) * 100 : 0,
      };
    })
    .sort((a, b) => b.rateNumber - a.rateNumber)
    .map(({ plan, rate }) => ({ plan, rate }));

  const currentMonth = new Date();
  const monthlyData = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(currentMonth, i);
      const startDate = startOfMonth(month);
      const endDate = endOfMonth(month);

      return Promise.all([
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
        prisma.client.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            traderStatus: TraderStatus.DIRECT,
          },
        }),
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
    completedClients,
    directClients,
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
  await requireAuthenticatedSession();

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
  await requireAuthenticatedSession();

  const months = Array.from({ length: 6 })
    .map((_, i) => {
      const date = subMonths(new Date(), i);
      return {
        startDate: startOfMonth(date),
        endDate: endOfMonth(date),
      };
    })
    .reverse();

  return Promise.all(
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
}

export async function getRecentClients() {
  await requireAuthenticatedSession();

  return prisma.client.findMany({
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
