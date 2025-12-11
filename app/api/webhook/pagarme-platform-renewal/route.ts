// app/api/webhook/pagarme-platform-renewal/route.ts
// Webhook dedicado exclusivamente para processar pagamentos de RENOVAÇÃO DE PLATAFORMA via PAGARME
// Separado do webhook de avaliação (/api/webhook/pagarme)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/webhook/pagarme-platform-renewal
 *
 * Recebe notificações do Pagarme quando um PIX de renovação é pago
 *
 * Eventos esperados:
 * - order.paid: Quando o pedido é pago
 */
export async function POST(req: NextRequest) {
  try {
    console.log("\n=== [Pagarme Platform Renewal Webhook] Webhook recebido ===");

    const payload = await req.text();
    console.log("[Pagarme Platform Renewal Webhook] Payload:", payload);

    const webhookData = JSON.parse(payload);

    // Processar apenas eventos de pagamento confirmado
    if (webhookData.type !== "order.paid") {
      console.log(
        "[Pagarme Platform Renewal Webhook] Evento ignorado:",
        webhookData.type
      );
      return NextResponse.json({ message: "Evento ignorado" });
    }

    // ✅ FILTRO: Verificar se tem metadata de renovação (proteção contra webhooks de avaliação)
    const metadata = webhookData.data?.metadata;
    if (!metadata?.type && !metadata?.service) {
      console.log(
        "[Pagarme Platform Renewal Webhook] ⚠️ Metadata ausente - Webhook ignorado (provavelmente é uma avaliação)"
      );
      return NextResponse.json({
        message: "Metadata de renovação ausente - webhook ignorado",
        info: "Este webhook não possui marcadores de renovação de plataforma",
      });
    }

    // Verificar se NÃO é uma renovação
    if (metadata.type !== "platform_renewal" && metadata.service !== "platform_renewal") {
      console.log(
        "[Pagarme Platform Renewal Webhook] ⚠️ Não é renovação de plataforma - Ignorando (será processado por /api/webhook/pagarme)"
      );
      return NextResponse.json({
        message: "Não é renovação de plataforma - webhook ignorado",
        info: "Este webhook será processado pelo endpoint de avaliações",
      });
    }

    const orderId = webhookData.data?.id;
    const orderStatus = webhookData.data?.status;

    console.log("[Pagarme Platform Renewal Webhook] Dados do webhook:", {
      event: webhookData.type,
      orderId,
      orderStatus,
      metadata: {
        type: metadata.type,
        service: metadata.service,
      },
    });

    if (!orderId) {
      console.log(
        "[Pagarme Platform Renewal Webhook] ❌ Order ID não encontrado"
      );
      return NextResponse.json(
        { error: "Order ID não encontrado no webhook" },
        { status: 400 }
      );
    }

    // Buscar renovação pendente pelo orderId (paymentId)
    const pendingRenewal = await prisma.platformRenewal.findFirst({
      where: {
        paymentId: orderId,
        status: "pending",
      },
      include: {
        client: {
          select: { name: true, email: true, platform: true },
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
        `[Pagarme Platform Renewal Webhook] ❌ Renovação pendente não encontrada para Order ID: ${orderId}`
      );
      return NextResponse.json(
        { error: "Renovação não encontrada", orderId },
        { status: 404 }
      );
    }

    console.log(
      `[Pagarme Platform Renewal Webhook] ✅ Renovação encontrada: ${pendingRenewal.id}`
    );
    console.log("[Pagarme Platform Renewal Webhook] Detalhes:", {
      renewalType: pendingRenewal.renewalType,
      platform: pendingRenewal.platform,
      amount: pendingRenewal.amount,
      clientId: pendingRenewal.clientId,
      paidAccountId: pendingRenewal.paidAccountId,
    });

    // Processar renovação em uma transação atômica
    await prisma.$transaction(async (tx) => {
      console.log(
        "[Pagarme Platform Renewal Webhook] Iniciando transação de renovação..."
      );

      // 1. Atualizar status da renovação para "paid" (aguardando processo manual)
      await tx.platformRenewal.update({
        where: { id: pendingRenewal.id },
        data: {
          status: "paid",
          renewalDate: new Date(), // Data de confirmação do pagamento
          updatedAt: new Date(),
        },
      });

      console.log(
        "[Pagarme Platform Renewal Webhook] ✅ Status da renovação atualizado para 'paid' (aguardando processo manual)"
      );
    });

    console.log(
      "[Pagarme Platform Renewal Webhook] ✅ Transação concluída com sucesso!"
    );

    // Preparar dados do cliente para log/email
    const customerName =
      pendingRenewal.renewalType === "evaluation"
        ? pendingRenewal.client?.name
        : pendingRenewal.paidAccount?.client.name;

    const customerEmail =
      pendingRenewal.renewalType === "evaluation"
        ? pendingRenewal.client?.email
        : pendingRenewal.paidAccount?.client.email;

    console.log(
      "[Pagarme Platform Renewal Webhook] Renovação processada para:",
      {
        customer: customerName,
        email: customerEmail,
        platform: pendingRenewal.platform,
        renewalType: pendingRenewal.renewalType,
      }
    );

    // TODO: Enviar email de confirmação de renovação
    console.log(
      `[Pagarme Platform Renewal Webhook] 📧 Email de confirmação será enviado para: ${customerEmail}`
    );

    return NextResponse.json({
      success: true,
      message: "Renovação processada com sucesso",
      renewal: {
        id: pendingRenewal.id,
        renewalType: pendingRenewal.renewalType,
        platform: pendingRenewal.platform,
        amount: pendingRenewal.amount,
        orderId,
      },
      customer: {
        name: customerName,
        email: customerEmail,
      },
    });
  } catch (error) {
    console.error(
      "[Pagarme Platform Renewal Webhook] ❌ Erro crítico:",
      error
    );

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhook/pagarme-platform-renewal
 *
 * Endpoint para verificar se o webhook está ativo
 */
export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "pagarme-platform-renewal",
    endpoint: "/api/webhook/pagarme-platform-renewal",
    events: ["order.paid"],
    description: "Webhook dedicado para renovações de plataforma via Pagarme",
  });
}
