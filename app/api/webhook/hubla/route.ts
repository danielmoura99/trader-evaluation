// app/api/webhook/hubla/route.ts
import { HublaService } from "@/lib/services/hubla";
import { HublaWebhookPayload } from "@/app/types/hubla";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("\n=== INÍCIO DO PROCESSAMENTO DO WEBHOOK ===");
    console.log("[Hubla Webhook] Iniciando processamento...");

    // Verificar secret configurado
    const webhookSecret = process.env.HUBLA_WEBHOOK_SECRET;
    console.log(
      "[Hubla Webhook] Secret configurado:",
      webhookSecret ? "Sim" : "Não"
    );

    if (!webhookSecret) {
      console.error("[Hubla Webhook] HUBLA_WEBHOOK_SECRET não configurado");
      return Response.json(
        {
          error: "Configuração inválida",
          message: "HUBLA_WEBHOOK_SECRET não configurado",
        },
        { status: 500 }
      );
    }

    // Log detalhado dos headers
    const allHeaders = Array.from(req.headers.entries());
    console.log("[Hubla Webhook] Headers completos:", allHeaders);

    // Verifica assinatura
    const signature = req.headers.get("x-hubla-signature");
    console.log("[Hubla Webhook] Assinatura recebida:", signature);

    if (!signature) {
      console.log(
        "[Hubla Webhook] Erro: Assinatura ausente no header x-hubla-signature"
      );
      return Response.json(
        {
          error: "Assinatura ausente",
          message: "O header x-hubla-signature é obrigatório para validação",
        },
        { status: 401 }
      );
    }

    // Lê e loga o payload
    const payload = await req.text();
    console.log(
      "[Hubla Webhook] Payload recebido (primeiros 200 caracteres):",
      payload.substring(0, 200) + "..."
    );

    const hublaService = new HublaService();

    // Verifica a assinatura com mais detalhes
    const isValid = hublaService.verifyWebhookSignature(payload, signature);
    console.log(
      "[Hubla Webhook] Resultado da validação da assinatura:",
      isValid
    );

    if (!isValid) {
      console.log("[Hubla Webhook] Erro: Assinatura inválida");
      return Response.json(
        {
          error: "Assinatura inválida",
          message: "A assinatura fornecida não corresponde ao payload",
        },
        { status: 401 }
      );
    }

    // Parse e validação do webhook data
    let webhookData: HublaWebhookPayload;
    try {
      webhookData = JSON.parse(payload) as HublaWebhookPayload;
      console.log("[Hubla Webhook] Dados processados:", {
        event_type: webhookData.event_type,
        created_at: webhookData.created_at,
        payment_id: webhookData.data?.id,
      });
    } catch (parseError) {
      console.error(
        "[Hubla Webhook] Erro ao fazer parse do payload:",
        parseError
      );
      return Response.json(
        {
          error: "Payload inválido",
          message: "Não foi possível processar o payload recebido",
        },
        { status: 400 }
      );
    }

    // Verifica tipo do evento
    if (webhookData.event_type !== "payment.succeeded") {
      console.log("[Hubla Webhook] Evento ignorado:", webhookData.event_type);
      return Response.json(
        {
          message: "Evento ignorado",
          event_type: webhookData.event_type,
        },
        { status: 200 }
      );
    }

    // Extrai e valida dados do pagamento
    const paymentData = hublaService.extractPaymentData(webhookData);
    if (!paymentData) {
      console.log(
        "[Hubla Webhook] Erro: Dados do pagamento inválidos ou incompletos"
      );
      return Response.json(
        {
          error: "Dados inválidos",
          message: "Não foi possível extrair os dados necessários do pagamento",
        },
        { status: 400 }
      );
    }

    console.log("[Hubla Webhook] Dados do pagamento extraídos:", {
      paymentId: paymentData.paymentId,
      platform: paymentData.platform,
      plan: paymentData.plan,
      customerEmail: paymentData.customerEmail,
    });

    // Processa o pagamento e gera o link
    const formUrl = await hublaService.processPayment(paymentData);
    console.log("[Hubla Webhook] Link do formulário gerado:", formUrl);

    console.log("=== FIM DO PROCESSAMENTO DO WEBHOOK ===\n");

    return Response.json({
      message: "Pagamento processado com sucesso",
      formUrl,
      paymentId: paymentData.paymentId,
    });
  } catch (error) {
    console.error("[Hubla Webhook] Erro crítico ao processar webhook:", error);

    // Log mais detalhado do erro
    if (error instanceof Error) {
      console.error("[Hubla Webhook] Detalhes do erro:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }

    return Response.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
