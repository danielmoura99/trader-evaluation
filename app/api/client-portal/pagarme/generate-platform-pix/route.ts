// app/api/client-portal/pagarme/generate-platform-pix/route.ts
// API pública para gerar PIX de RENOVAÇÃO DE PLATAFORMA via PAGARME
// Separado do BTG (generate-platform-pix) e do Pagarme de avaliação

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  prepareClientRenewalData,
  preparePaidAccountRenewalData,
  RenewalType,
} from "@/lib/services/platform-renewal-service";
import { generatePlatformRenewalPix } from "@/lib/services/pagarme-platform-pix";

const API_KEY = process.env.API_KEY;

// CORS headers para permitir chamadas do client-portal
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return Response.json({}, { headers: corsHeaders });
}

/**
 * POST /api/client-portal/pagarme/generate-platform-pix
 *
 * Gera PIX de renovação de plataforma via Pagarme
 *
 * Body: {
 *   evaluationId: string,    // ID do Client ou PaidAccount
 *   renewalType: "evaluation" | "paid_account"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    console.log(
      "\n=== [Pagarme Platform Renewal] Solicitação de geração de PIX ==="
    );

    // Validar API Key
    const authHeader = req.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");

    if (!apiKey || apiKey !== API_KEY) {
      console.log("[Pagarme Platform Renewal] ❌ API Key inválida");
      return Response.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Obter dados do body
    const body = await req.json();
    const { evaluationId, renewalType } = body as {
      evaluationId: string;
      renewalType: RenewalType;
    };

    console.log("[Pagarme Platform Renewal] Dados recebidos:", {
      evaluationId,
      renewalType,
    });

    // Validar parâmetros
    if (!evaluationId || !renewalType) {
      console.log("[Pagarme Platform Renewal] ❌ Parâmetros faltando");
      return Response.json(
        { error: "evaluationId e renewalType são obrigatórios" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (renewalType !== "evaluation" && renewalType !== "paid_account") {
      console.log("[Pagarme Platform Renewal] ❌ renewalType inválido");
      return Response.json(
        { error: "renewalType inválido. Use 'evaluation' ou 'paid_account'" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Preparar dados de renovação
    console.log(
      "[Pagarme Platform Renewal] Preparando dados de renovação..."
    );

    const renewalData =
      renewalType === "evaluation"
        ? await prepareClientRenewalData(evaluationId)
        : await preparePaidAccountRenewalData(evaluationId);

    if (!renewalData) {
      console.log(
        "[Pagarme Platform Renewal] ❌ Não elegível para renovação"
      );
      return Response.json(
        {
          error: "Não elegível para renovação",
          details:
            "A renovação só está disponível 3 dias antes do vencimento ou após vencimento",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log("[Pagarme Platform Renewal] Dados de renovação preparados:", {
      customerName: renewalData.customerName,
      platform: renewalData.platform,
      amount: renewalData.amount,
    });

    // Gerar PIX via Pagarme
    console.log("[Pagarme Platform Renewal] Gerando PIX via Pagarme...");

    const pixResponse = await generatePlatformRenewalPix(renewalData);

    if (!pixResponse.success) {
      console.log("[Pagarme Platform Renewal] ❌ Erro ao gerar PIX");
      return Response.json(
        {
          error: "Erro ao gerar PIX",
          details: "Falha na comunicação com Pagarme",
        },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log("[Pagarme Platform Renewal] ✅ PIX gerado com sucesso:", {
      orderId: pixResponse.orderId,
      amount: pixResponse.amount,
    });

    // Criar registro de renovação pendente
    const renewalRecord = await prisma.platformRenewal.create({
      data: {
        renewalType: renewalData.renewalType,
        paymentId: pixResponse.orderId,
        renewalDate: new Date(),
        amount: renewalData.amount,
        platform: renewalData.platform,
        status: "pending",
        pixCode: pixResponse.pixCode,
        pixExpiresAt: pixResponse.expiresAt,
        ...(renewalType === "evaluation"
          ? { clientId: evaluationId }
          : { paidAccountId: evaluationId }),
      },
    });

    console.log(
      "[Pagarme Platform Renewal] ✅ Renovação criada no banco:",
      renewalRecord.id
    );

    // Atualizar renewalPaymentId na entidade
    if (renewalType === "evaluation") {
      await prisma.client.update({
        where: { id: evaluationId },
        data: { renewalPaymentId: pixResponse.orderId },
      });
    } else {
      await prisma.paidAccount.update({
        where: { id: evaluationId },
        data: { renewalPaymentId: pixResponse.orderId },
      });
    }

    console.log(
      "[Pagarme Platform Renewal] ✅ Processo completo! Retornando dados ao cliente"
    );

    return Response.json(
      {
        success: true,
        renewal: {
          id: renewalRecord.id,
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
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[Pagarme Platform Renewal] ❌ Erro crítico:", error);
    return Response.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
