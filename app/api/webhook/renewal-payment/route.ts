// app/api/webhooks/renewal-payment/route.ts
// Webhook para processar confirmação de pagamento de renovação

import { NextRequest } from "next/server";
import { processConfirmedRenewal } from "@/lib/renewal-service";

export async function POST(req: NextRequest) {
  try {
    console.log("[Renewal Webhook] Processando pagamento de renovação...");

    // Verificar API Key (mesma validação dos outros webhooks)
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[Renewal Webhook] API Key não fornecida");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = authHeader.replace("Bearer ", "");
    if (apiKey !== process.env.API_KEY) {
      console.log("[Renewal Webhook] API Key inválida");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse do payload do webhook
    const webhookData = await req.json();
    console.log("[Renewal Webhook] Dados recebidos:", webhookData);

    // Validar estrutura do webhook
    if (!webhookData.paymentId || !webhookData.status) {
      return Response.json(
        { error: "Dados obrigatórios não fornecidos" },
        { status: 400 }
      );
    }

    // Processar apenas pagamentos confirmados
    if (webhookData.status !== "paid" && webhookData.status !== "confirmed") {
      console.log(`[Renewal Webhook] Status ${webhookData.status} ignorado`);
      return Response.json({
        success: true,
        message: "Status não processável, ignorado",
      });
    }

    // Verificar se é uma renovação baseada na metadata
    const isRenewal = webhookData.metadata?.type === "renewal";
    if (!isRenewal) {
      console.log("[Renewal Webhook] Não é uma renovação, ignorando");
      return Response.json({
        success: true,
        message: "Não é uma renovação",
      });
    }

    // Processar renovação
    const success = await processConfirmedRenewal(webhookData.paymentId);

    if (!success) {
      console.error("[Renewal Webhook] Falha ao processar renovação");
      return Response.json(
        { error: "Falha ao processar renovação" },
        { status: 500 }
      );
    }

    console.log(
      `[Renewal Webhook] Renovação processada com sucesso: ${webhookData.paymentId}`
    );

    // TODO: Enviar email de confirmação para o cliente
    // await sendRenewalConfirmationEmail(webhookData.metadata.paidAccountId);

    return Response.json({
      success: true,
      message: "Renovação processada com sucesso",
      paymentId: webhookData.paymentId,
    });
  } catch (error) {
    console.error("[Renewal Webhook] Erro:", error);
    return Response.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// Função auxiliar para envio de email (implementar futuramente)
//async function sendRenewalConfirmationEmail(paidAccountId: string) {
// TODO: Implementar envio de email de confirmação
/*
  const paidAccount = await prisma.paidAccount.findUnique({
    where: { id: paidAccountId },
    include: { client: true }
  });

  if (paidAccount) {
    await sendEmail({
      to: paidAccount.client.email,
      subject: "Renovação Confirmada - Traders House",
      template: "renewal-confirmation",
      data: {
        clientName: paidAccount.client.name,
        platform: paidAccount.platform,
        newExpirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 dias
      }
    });
  }
  */
//}
