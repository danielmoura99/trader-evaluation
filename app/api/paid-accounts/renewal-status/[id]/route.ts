// app/api/paid-accounts/renewal-status/[id]/route.ts
// API para verificar status de renovação de uma conta

import { NextRequest } from "next/server";
import { checkRenewalStatus, getRenewalHistory } from "@/lib/renewal-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paidAccountId = params.id;

    if (!paidAccountId) {
      return Response.json(
        { error: "ID da conta remunerada é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar status de renovação
    const renewalStatus = await checkRenewalStatus(paidAccountId);

    if (!renewalStatus) {
      return Response.json(
        {
          error: "Conta não encontrada ou não é elegível para renovação",
          details: "A conta deve estar ativa e ter uma data de ativação válida",
        },
        { status: 404 }
      );
    }

    // Obter histórico de renovações
    const renewalHistory = await getRenewalHistory(paidAccountId);

    return Response.json({
      success: true,
      renewalStatus,
      renewalHistory: renewalHistory.map((renewal) => ({
        id: renewal.id,
        renewalDate: renewal.renewalDate,
        amount: renewal.amount,
        platform: renewal.platform,
        status: renewal.status,
        paymentId: renewal.paymentId,
      })),
    });
  } catch (error) {
    console.error("[Renewal Status API] Erro:", error);
    return Response.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
