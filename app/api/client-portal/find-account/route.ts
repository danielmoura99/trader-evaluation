// app/api/client-portal/find-account/route.ts
// API para encontrar conta do cliente por CPF/Email (autenticação básica)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/client-portal/find-account
 * Body: { cpf: string, birthDate: string } ou { email: string, birthDate: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cpf, email, birthDate } = body as {
      cpf?: string;
      email?: string;
      birthDate: string;
    };

    if (!birthDate) {
      return Response.json(
        { error: "Data de nascimento é obrigatória" },
        { status: 400 }
      );
    }

    if (!cpf && !email) {
      return Response.json(
        { error: "CPF ou Email é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar cliente
    const client = await prisma.client.findFirst({
      where: {
        AND: [
          cpf ? { cpf: cpf.replace(/\D/g, "") } : { email },
          { birthDate: new Date(birthDate) },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        platform: true,
        plan: true,
        traderStatus: true,
        startDate: true,
        endDate: true,
        platformStartDate: true,
        lastRenewalDate: true,
        renewalPaymentId: true,
        paidAccount: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            lastRenewalDate: true,
            renewalPaymentId: true,
          },
        },
      },
    });

    if (!client) {
      return Response.json(
        {
          error: "Cliente não encontrado",
          details: "Verifique CPF/Email e data de nascimento",
        },
        { status: 404 }
      );
    }

    // Determinar tipo de conta
    const accountType =
      client.traderStatus === "Aprovado" && client.paidAccount
        ? "paid_account"
        : "evaluation";

    const accountData =
      accountType === "paid_account"
        ? {
            entityId: client.paidAccount!.id,
            renewalType: "paid_account" as const,
            status: client.paidAccount!.status,
            startDate: client.paidAccount!.startDate,
            endDate: client.paidAccount!.endDate,
            lastRenewalDate: client.paidAccount!.lastRenewalDate,
            renewalPaymentId: client.paidAccount!.renewalPaymentId,
          }
        : {
            entityId: client.id,
            renewalType: "evaluation" as const,
            status: client.traderStatus,
            startDate: client.startDate,
            endDate: client.endDate,
            platformStartDate: client.platformStartDate,
            lastRenewalDate: client.lastRenewalDate,
            renewalPaymentId: client.renewalPaymentId,
          };

    return Response.json({
      success: true,
      client: {
        name: client.name,
        email: client.email,
        cpf: client.cpf,
        platform: client.platform,
        plan: client.plan,
      },
      account: accountData,
    });
  } catch (error) {
    console.error("[Find Account API] Erro:", error);
    return Response.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
