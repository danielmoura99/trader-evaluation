// trader-evaluation/app/api/client-evaluations/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { differenceInDays } from "date-fns";

const API_KEY = process.env.API_KEY;

// Helper para calcular dias até expiração da plataforma
function calculatePlatformDaysLeft(platformStartDate: Date | null): number | null {
  if (!platformStartDate) return null;

  const platformEndDate = new Date(platformStartDate);
  platformEndDate.setDate(platformEndDate.getDate() + 30);

  return differenceInDays(platformEndDate, new Date());
}

export async function GET(req: NextRequest) {
  try {
    // Validar API Key
    const authHeader = req.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");

    if (!apiKey || apiKey !== API_KEY) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obter parâmetros da query
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get("email");
    const cpf = searchParams.get("cpf");

    if (!email && !cpf) {
      return Response.json(
        { error: "Email ou CPF são necessários" },
        { status: 400 }
      );
    }

    // Buscar Clients (avaliações)
    const clients = await prisma.client.findMany({
      where: {
        OR: [{ email: email || undefined }, { cpf: cpf || undefined }],
      },
      select: {
        id: true,
        name: true,
        cpf: true,
        phone: true,
        birthDate: true,
        address: true,
        zipCode: true,
        email: true,
        platform: true,
        plan: true,
        traderStatus: true,
        startDate: true,
        endDate: true,
        platformStartDate: true,
        paidAccount: {
          select: {
            id: true,
            platform: true,
            plan: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    type EvaluationItem = {
      id: string;
      renewalType: "evaluation" | "paid_account";
      name: string | null;
      cpf: string | null;
      phone: string | null;
      birthDate: Date | null;
      address: string | null;
      zipCode: string | null;
      email: string | null;
      platform: string | null;
      plan: string | null;
      traderStatus: string | null;
      startDate: Date | null;
      endDate: Date | null;
      platformRenewal: {
        platformStartDate: Date | null;
        daysUntilExpiration: number | null;
        canRenew: boolean;
        isExpired: boolean;
        needsRenewal: boolean;
      };
    };

    const allEvaluations: EvaluationItem[] = [];

    // Processar Clients (avaliações)
    clients.forEach((client) => {
      const platformDaysLeft = calculatePlatformDaysLeft(client.platformStartDate);

      allEvaluations.push({
        id: client.id,
        renewalType: "evaluation", // Identificar tipo
        name: client.name,
        cpf: client.cpf,
        phone: client.phone,
        birthDate: client.birthDate,
        address: client.address,
        zipCode: client.zipCode,
        email: client.email,
        platform: client.platform,
        plan: client.plan,
        traderStatus: client.traderStatus,
        startDate: client.startDate,
        endDate: client.endDate,
        platformRenewal: {
          platformStartDate: client.platformStartDate,
          daysUntilExpiration: platformDaysLeft,
          canRenew: platformDaysLeft !== null && platformDaysLeft <= 3,
          isExpired: platformDaysLeft !== null && platformDaysLeft < 0,
          needsRenewal: platformDaysLeft !== null && platformDaysLeft <= 7,
        },
      });

      // Se o cliente também tem PaidAccount, adicionar
      if (client.paidAccount) {
        const paidPlatformDaysLeft = calculatePlatformDaysLeft(
          client.paidAccount.startDate
        );

        allEvaluations.push({
          id: client.paidAccount.id,
          renewalType: "paid_account", // Identificar tipo
          name: client.name,
          cpf: client.cpf,
          phone: client.phone,
          birthDate: client.birthDate,
          address: client.address,
          zipCode: client.zipCode,
          email: client.email,
          platform: client.paidAccount.platform,
          plan: client.paidAccount.plan,
          traderStatus: client.paidAccount.status,
          startDate: client.paidAccount.startDate,
          endDate: client.paidAccount.endDate,
          platformRenewal: {
            platformStartDate: client.paidAccount.startDate,
            daysUntilExpiration: paidPlatformDaysLeft,
            canRenew: paidPlatformDaysLeft !== null && paidPlatformDaysLeft <= 3,
            isExpired: paidPlatformDaysLeft !== null && paidPlatformDaysLeft < 0,
            needsRenewal: paidPlatformDaysLeft !== null && paidPlatformDaysLeft <= 7,
          },
        });
      }
    });

    return Response.json({ evaluations: allEvaluations });
  } catch (error) {
    console.error("[API] Erro ao buscar avaliações:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
