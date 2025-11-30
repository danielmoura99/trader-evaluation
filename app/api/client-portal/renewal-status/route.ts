// app/api/client-portal/renewal-status/route.ts
// API pública para consultar status de renovação (usado pelo portal do cliente)

import { NextRequest } from "next/server";
import {
  checkClientRenewalStatus,
  checkPaidAccountRenewalStatus,
  getPlatformRenewalHistory,
  RenewalType,
} from "@/lib/services/platform-renewal-service";

/**
 * GET /api/client-portal/renewal-status?entityId=xxx&renewalType=evaluation
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get("entityId");
    const renewalType = searchParams.get("renewalType") as RenewalType;

    if (!entityId || !renewalType) {
      return Response.json(
        { error: "entityId e renewalType são obrigatórios" },
        { status: 400 }
      );
    }

    if (renewalType !== "evaluation" && renewalType !== "paid_account") {
      return Response.json(
        { error: "renewalType inválido. Use 'evaluation' ou 'paid_account'" },
        { status: 400 }
      );
    }

    // Verificar status de renovação
    const renewalStatus =
      renewalType === "evaluation"
        ? await checkClientRenewalStatus(entityId)
        : await checkPaidAccountRenewalStatus(entityId);

    if (!renewalStatus) {
      return Response.json(
        {
          error: "Registro não encontrado ou não elegível para renovação",
          details: "Verifique se o ID está correto e se a conta está ativa",
        },
        { status: 404 }
      );
    }

    // Obter histórico de renovações
    const renewalHistory = await getPlatformRenewalHistory(
      entityId,
      renewalType
    );

    return Response.json({
      success: true,
      renewalStatus: {
        canRenew: renewalStatus.canRenew,
        daysUntilExpiration: renewalStatus.daysUntilExpiration,
        expirationDate: renewalStatus.expirationDate,
        renewalPrice: renewalStatus.renewalPrice,
        renewalPriceFormatted: renewalStatus.renewalPriceFormatted,
        platform: renewalStatus.platform,
        plan: renewalStatus.plan,
        status: renewalStatus.status,
        renewalType: renewalStatus.renewalType,
        lastRenewalDate: renewalStatus.lastRenewalDate,
      },
      renewalHistory: renewalHistory.map((renewal) => ({
        id: renewal.id,
        renewalDate: renewal.renewalDate,
        amount: renewal.amount,
        platform: renewal.platform,
        status: renewal.status,
        paymentId: renewal.paymentId,
        pixCode: renewal.pixCode,
        pixExpiresAt: renewal.pixExpiresAt,
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
