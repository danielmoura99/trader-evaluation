// app/api/webhook/hubla/route.ts
import { HublaService } from "@/lib/services/hubla";
import { HublaWebhookPayload } from "@/app/types/hubla";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Verifica se é um evento de pagamento bem-sucedido
    const signature = req.headers.get("x-hubla-signature");
    if (!signature) {
      return Response.json({ error: "Assinatura ausente" }, { status: 401 });
    }

    const payload = await req.text();
    const hublaService = new HublaService();

    // Verifica a assinatura
    const isValid = hublaService.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      return Response.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    const webhookData = JSON.parse(payload) as HublaWebhookPayload;

    // Verifica se é um pagamento bem-sucedido
    if (webhookData.event_type !== "payment.succeeded") {
      return Response.json({ message: "Evento ignorado" }, { status: 200 });
    }

    // Extrai os dados do pagamento
    const paymentData = hublaService.extractPaymentData(webhookData);
    if (!paymentData) {
      return Response.json(
        { error: "Dados do pagamento inválidos" },
        { status: 400 }
      );
    }

    // Processa o pagamento e gera o link
    const formUrl = await hublaService.processPayment(paymentData);

    // Aqui você pode adicionar lógica para enviar o link por email
    // await sendPaymentConfirmationEmail(paymentData.customerEmail, formUrl);

    return Response.json({
      message: "Pagamento processado com sucesso",
      formUrl,
    });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
