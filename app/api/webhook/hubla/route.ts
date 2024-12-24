// app/api/webhook/hubla/route.ts
import { HublaService } from "@/lib/services/hubla";
import { HublaWebhookPayload } from "@/app/types/hubla";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("[Hubla Webhook] Recebendo evento...");

    // Log dos headers para debug
    const headers = Object.fromEntries(req.headers);
    console.log("[Hubla Webhook] Headers:", headers);

    // Verifica assinatura
    const signature = req.headers.get("x-hubla-signature");
    if (!signature) {
      console.log("[Hubla Webhook] Erro: Assinatura ausente");
      return Response.json({ error: "Assinatura ausente" }, { status: 401 });
    }

    const payload = await req.text();
    console.log("[Hubla Webhook] Payload recebido:", payload);

    const hublaService = new HublaService();

    // Verifica a assinatura
    const isValid = hublaService.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      console.log("[Hubla Webhook] Erro: Assinatura inválida");
      return Response.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    const webhookData = JSON.parse(payload) as HublaWebhookPayload;
    console.log("[Hubla Webhook] Dados processados:", webhookData);

    // Verifica se é um pagamento bem-sucedido
    if (webhookData.event_type !== "payment.succeeded") {
      console.log("[Hubla Webhook] Evento ignorado:", webhookData.event_type);
      return Response.json({ message: "Evento ignorado" }, { status: 200 });
    }

    // Extrai os dados do pagamento
    const paymentData = hublaService.extractPaymentData(webhookData);
    if (!paymentData) {
      console.log("[Hubla Webhook] Erro: Dados do pagamento inválidos");
      return Response.json(
        { error: "Dados do pagamento inválidos" },
        { status: 400 }
      );
    }

    console.log("[Hubla Webhook] Dados do pagamento:", paymentData);

    // Processa o pagamento e gera o link
    const formUrl = await hublaService.processPayment(paymentData);
    console.log("[Hubla Webhook] Link do formulário gerado:", formUrl);

    return Response.json({
      message: "Pagamento processado com sucesso",
      formUrl,
    });
  } catch (error) {
    console.error("[Hubla Webhook] Erro ao processar webhook:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
