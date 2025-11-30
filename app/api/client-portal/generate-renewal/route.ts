// app/api/client-portal/generate-renewal/route.ts
// API pública para gerar PIX de renovação (usado pelo portal do cliente)

import { NextRequest } from "next/server";
import {
  prepareClientRenewalData,
  preparePaidAccountRenewalData,
  createPendingPlatformRenewal,
  RenewalType,
} from "@/lib/services/platform-renewal-service";
import { generatePixForRenewal } from "@/lib/services/pagarme-pix-service";

/**
 * POST /api/client-portal/generate-renewal
 * Body: { entityId: string, renewalType: "evaluation" | "paid_account" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { entityId, renewalType } = body as {
      entityId: string;
      renewalType: RenewalType;
    };

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

    // Preparar dados de renovação
    const renewalData =
      renewalType === "evaluation"
        ? await prepareClientRenewalData(entityId)
        : await preparePaidAccountRenewalData(entityId);

    if (!renewalData) {
      return Response.json(
        {
          error: "Não elegível para renovação",
          details:
            "A renovação só está disponível 3 dias antes do vencimento ou após vencimento",
        },
        { status: 400 }
      );
    }

    console.log(
      `[Generate Renewal API] Gerando PIX para ${renewalType}:`,
      entityId
    );

    // Gerar PIX via Pagarme
    const pixResponse = await generatePixForRenewal(renewalData);

    if (!pixResponse.success) {
      return Response.json(
        { error: "Erro ao gerar PIX", details: "Falha na comunicação com Pagarme" },
        { status: 500 }
      );
    }

    console.log(
      `[Generate Renewal API] PIX gerado com sucesso. Order ID: ${pixResponse.orderId}`
    );

    // Criar registro pendente de renovação
    const renewalId = await createPendingPlatformRenewal(
      renewalData,
      pixResponse.orderId,
      pixResponse.pixCode,
      pixResponse.expiresAt
    );

    return Response.json({
      success: true,
      renewal: {
        id: renewalId,
        orderId: pixResponse.orderId,
        amount: pixResponse.amount,
        platform: renewalData.platform,
        renewalType: renewalData.renewalType,
        pixCode: pixResponse.pixCode,
        pixQrCode: pixResponse.pixQrCode,
        expiresAt: pixResponse.expiresAt,
      },
      customer: {
        name: renewalData.customerName,
        email: renewalData.customerEmail,
      },
    });
  } catch (error) {
    console.error("[Generate Renewal API] Erro:", error);
    return Response.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
