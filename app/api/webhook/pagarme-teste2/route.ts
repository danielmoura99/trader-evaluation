// app/api/webhook/pagarme/route.ts
import { NextRequest } from "next/server";
import { PagarmeWebhookService } from "@/lib/services/pagarme-webhook";
import { prisma } from "@/lib/prisma";
import { processEvaluation } from "@/lib/services/evaluation-service";
import { processCombo } from "@/lib/services/combo-service";
import { processEducational } from "@/lib/services/educational-service";

export async function POST(req: NextRequest) {
  try {
    console.log("\n=== INÍCIO DO PROCESSAMENTO DO WEBHOOK PAGAR.ME ===");

    // Obter e logar o payload
    const payload = await req.text();
    console.log("[Pagar.me Webhook] Payload recebido:", payload);

    const webhookData = JSON.parse(payload);
    if (webhookData.type !== "order.paid") {
      console.log("[Pagar.me Webhook] Evento ignorado:", webhookData.type);
      return Response.json({ message: "Evento ignorado" });
    }

    // Extrair dados do webhook
    const webhookService = new PagarmeWebhookService();
    const paymentData = webhookService.extractPaymentData(webhookData);

    if (!paymentData) {
      console.log("[Pagar.me Webhook] Dados de pagamento inválidos");
      return Response.json(
        { error: "Dados de pagamento inválidos" },
        { status: 400 }
      );
    }

    // Registrar o pagamento no banco de dados
    const payment = await prisma.payment.create({
      data: {
        hublaPaymentId: paymentData.orderId, // Usamos orderId no campo hublaPaymentId
        platform: paymentData.platform,
        plan: paymentData.plan,
        amount: paymentData.amount,
        customerEmail: paymentData.customerEmail,
        customerName: paymentData.customerName,
        customerPhone: paymentData.customerPhone,
        customerDocument: paymentData.customerDocument,
        status: "received",
        saleDate: paymentData.saleDate,
        paymentMethod: paymentData.paymentMethod,
      },
    });

    console.log("[Pagar.me Webhook] Pagamento registrado:", payment.id);

    // Determinar o tipo de produto e processar conforme o cenário apropriado
    const productType = paymentData.metadata.productType?.toLowerCase();

    console.log("[Pagar.me Webhook] Metadata recebido:", {
      productType: paymentData.metadata.productType,
      courseId: paymentData.metadata.courseId,
      course_id: paymentData.metadata.course_id,
    });

    let processResult;

    if (productType === "combo") {
      console.log(
        "[Pagar.me Webhook] Processando como COMBO (avaliação + educacional)"
      );
      processResult = await processCombo({
        paymentData,
        hublaPaymentId: payment.hublaPaymentId,
      });
    } else if (productType === "educational") {
      console.log("[Pagar.me Webhook] Processando como EDUCACIONAL");
      processResult = await processEducational({
        paymentData,
        hublaPaymentId: payment.hublaPaymentId,
      });
    } else {
      // Default: processar como avaliação normal
      console.log("[Pagar.me Webhook] Processando como AVALIAÇÃO");
      processResult = await processEvaluation({
        paymentData,
        hublaPaymentId: payment.hublaPaymentId,
      });
    }

    console.log("[Pagar.me Webhook] Processamento concluído:", {
      type: processResult.type,
      success: processResult.success,
      emailSent: processResult.emailSent,
    });

    console.log("=== FIM DO PROCESSAMENTO DO WEBHOOK PAGAR.ME ===\n");

    return Response.json({
      success: true,
      paymentId: payment.id,
      orderId: paymentData.orderId,
      processResult,
    });
  } catch (error) {
    console.error("[Pagar.me Webhook] Erro crítico:", error);
    return Response.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
