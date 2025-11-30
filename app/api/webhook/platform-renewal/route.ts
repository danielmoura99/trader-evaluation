/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/webhook/platform-renewal/route.ts
// Webhook dedicado exclusivamente para processar pagamentos de renovação de plataforma
// Suporta: Pagarme (atual) e BTG Pactual (futuro)

import { NextRequest } from "next/server";
import { processConfirmedPlatformRenewal } from "@/lib/services/platform-renewal-service";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/webhook/platform-renewal
 * Processa confirmação de pagamento de renovação via Pagarme ou BTG
 */
export async function POST(req: NextRequest) {
  try {
    console.log("\n=== WEBHOOK RENOVAÇÃO DE PLATAFORMA ===");

    const payload = await req.text();
    console.log("[Platform Renewal Webhook] Payload recebido:", payload);

    const webhookData = JSON.parse(payload);

    // Detectar origem do webhook (Pagarme ou BTG)
    const webhookSource = detectWebhookSource(webhookData);
    console.log("[Platform Renewal Webhook] Fonte detectada:", webhookSource);

    let orderId: string | null = null;
    let paymentStatus: string | null = null;

    // Processar baseado na fonte
    if (webhookSource === "pagarme") {
      const pagarmeResult = processPagarmeWebhook(webhookData);
      if (!pagarmeResult) {
        console.log("[Platform Renewal Webhook] Evento Pagarme ignorado");
        return Response.json({ message: "Evento ignorado" });
      }
      orderId = pagarmeResult.orderId;
      paymentStatus = pagarmeResult.status;
    } else if (webhookSource === "btg") {
      // TODO: Implementar processamento BTG Pactual
      const btgResult = processBtgWebhook(webhookData);
      if (!btgResult) {
        console.log("[Platform Renewal Webhook] Evento BTG ignorado");
        return Response.json({ message: "Evento ignorado" });
      }
      orderId = btgResult.orderId;
      paymentStatus = btgResult.status;
    } else {
      console.log("[Platform Renewal Webhook] Fonte desconhecida");
      return Response.json(
        { error: "Fonte de webhook não reconhecida" },
        { status: 400 }
      );
    }

    // Verificar se é pagamento confirmado
    if (paymentStatus !== "paid" && paymentStatus !== "confirmed") {
      console.log(
        `[Platform Renewal Webhook] Status não processável: ${paymentStatus}`
      );
      return Response.json({
        message: "Status não requer processamento",
        status: paymentStatus,
      });
    }

    if (!orderId) {
      console.log("[Platform Renewal Webhook] Order ID não encontrado");
      return Response.json(
        { error: "Order ID não encontrado no webhook" },
        { status: 400 }
      );
    }

    console.log(
      `[Platform Renewal Webhook] Processando renovação para Order ID: ${orderId}`
    );

    // Buscar renovação pendente
    const pendingRenewal = await prisma.platformRenewal.findFirst({
      where: {
        paymentId: orderId,
        status: "pending",
      },
      include: {
        client: {
          select: { name: true, email: true },
        },
        paidAccount: {
          include: {
            client: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!pendingRenewal) {
      console.log(
        `[Platform Renewal Webhook] Renovação pendente não encontrada para Order ID: ${orderId}`
      );
      return Response.json(
        { error: "Renovação não encontrada", orderId },
        { status: 404 }
      );
    }

    console.log(
      `[Platform Renewal Webhook] Renovação encontrada: ${pendingRenewal.id} - Tipo: ${pendingRenewal.renewalType}`
    );

    // Processar renovação confirmada
    const success = await processConfirmedPlatformRenewal(orderId);

    if (!success) {
      console.error("[Platform Renewal Webhook] Falha ao processar renovação");
      return Response.json(
        { error: "Erro ao processar renovação" },
        { status: 500 }
      );
    }

    console.log(
      "[Platform Renewal Webhook] ✅ Renovação processada com sucesso!"
    );

    // TODO: Enviar email de confirmação
    const customerName =
      pendingRenewal.renewalType === "evaluation"
        ? pendingRenewal.client?.name
        : pendingRenewal.paidAccount?.client.name;

    const customerEmail =
      pendingRenewal.renewalType === "evaluation"
        ? pendingRenewal.client?.email
        : pendingRenewal.paidAccount?.client.email;

    console.log(
      `[Platform Renewal Webhook] Email de confirmação será enviado para: ${customerEmail}`
    );

    return Response.json({
      success: true,
      message: "Renovação processada com sucesso",
      renewal: {
        id: pendingRenewal.id,
        renewalType: pendingRenewal.renewalType,
        platform: pendingRenewal.platform,
        amount: pendingRenewal.amount,
      },
      customer: {
        name: customerName,
        email: customerEmail,
      },
      webhookSource,
    });
  } catch (error) {
    console.error("[Platform Renewal Webhook] Erro crítico:", error);
    return Response.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

/**
 * Detectar origem do webhook
 */
function detectWebhookSource(webhookData: any): "pagarme" | "btg" | "unknown" {
  // Pagarme tem campo "type" com formato "order.xxx"
  if (webhookData.type && webhookData.type.startsWith("order.")) {
    return "pagarme";
  }

  // BTG Pactual - estrutura a ser definida
  if (webhookData.event_type || webhookData.transaction_id) {
    return "btg";
  }

  return "unknown";
}

/**
 * Processar webhook do Pagarme
 */
function processPagarmeWebhook(webhookData: any): {
  orderId: string;
  status: string;
} | null {
  // Aceitar apenas eventos de pagamento confirmado
  if (webhookData.type !== "order.paid") {
    return null;
  }

  const orderId = webhookData.data?.id;
  const status = webhookData.data?.status;

  if (!orderId || !status) {
    return null;
  }

  return {
    orderId,
    status,
  };
}

/**
 * Processar webhook do BTG Pactual
 * TODO: Implementar quando integração BTG for adicionada
 */
function processBtgWebhook(webhookData: any): {
  orderId: string;
  status: string;
} | null {
  console.log("[BTG Webhook] Implementação pendente");

  // Placeholder para futura implementação
  // Estrutura esperada do BTG (exemplo hipotético):
  /*
  if (webhookData.event_type === "payment.confirmed") {
    return {
      orderId: webhookData.transaction_id,
      status: "confirmed"
    };
  }
  */

  return null;
}
