// app/api/webhook/hubla/route.ts
import { HublaService } from "@/lib/services/hubla";
import { HublaWebhookPayload } from "@/app/types/hubla";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("\n=== INÍCIO DO PROCESSAMENTO DO WEBHOOK ===");
    console.log("[Hubla Webhook] Iniciando processamento...");

    // Verificar se é ambiente sandbox
    const isSandbox = req.headers.get("x-hubla-sandbox") === "true";
    console.log("[Hubla Webhook] Ambiente sandbox:", isSandbox);

    // Log dos headers
    const allHeaders = Array.from(req.headers.entries());
    console.log("[Hubla Webhook] Headers completos:", allHeaders);

    // Lê o payload
    const payload = await req.text();
    console.log("[Hubla Webhook] Payload completo:", payload);

    // Verifica assinatura apenas em produção
    if (!isSandbox) {
      const signature = req.headers.get("x-hubla-signature");
      if (!signature) {
        console.log("[Hubla Webhook] Erro: Assinatura ausente");
        return Response.json({ error: "Assinatura ausente" }, { status: 401 });
      }

      const hublaService = new HublaService();
      const isValid = hublaService.verifyWebhookSignature(payload, signature);
      if (!isValid) {
        console.log("[Hubla Webhook] Erro: Assinatura inválida");
        return Response.json({ error: "Assinatura inválida" }, { status: 401 });
      }
    } else {
      console.log(
        "[Hubla Webhook] Pulando verificação de assinatura em ambiente sandbox"
      );
    }

    // Parse do payload
    let webhookData: HublaWebhookPayload;
    try {
      webhookData = JSON.parse(payload);
      console.log("[Hubla Webhook] Dados processados:", {
        type: webhookData.type,
        productName: webhookData.event.product.name,
        userId: webhookData.event.user.id,
      });
    } catch (parseError) {
      console.error(
        "[Hubla Webhook] Erro ao fazer parse do payload:",
        parseError
      );
      return Response.json(
        {
          error: "Payload inválido",
        },
        { status: 400 }
      );
    }

    // Verifica tipo do evento
    if (webhookData.type !== "invoice.payment_succeeded") {
      console.log("[Hubla Webhook] Evento ignorado:", webhookData.type);
      return Response.json(
        {
          message: "Evento ignorado",
        },
        { status: 200 }
      );
    }

    const hublaService = new HublaService();

    // Extrai e valida dados do pagamento
    const paymentData = hublaService.extractPaymentData(webhookData);
    if (!paymentData) {
      console.log("[Hubla Webhook] Erro: Dados do pagamento inválidos");
      return Response.json(
        {
          error: "Dados inválidos",
        },
        { status: 400 }
      );
    }

    // Processa o pagamento
    const savedPayment = await hublaService.processPayment(paymentData);

    console.log("=== FIM DO PROCESSAMENTO DO WEBHOOK ===\n");

    return Response.json({
      message: "Pagamento processado com sucesso",
      paymentId: savedPayment.hublaPaymentId,
      sandbox: isSandbox,
    });
  } catch (error) {
    console.error("[Hubla Webhook] Erro crítico:", error);
    return Response.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
