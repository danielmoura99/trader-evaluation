// app/api/webhook/pagarme/route.ts
import { NextRequest } from "next/server";
import { PagarmeWebhookService } from "@/lib/services/pagarme-webhook";
import { prisma } from "@/lib/prisma";
import { processEvaluation } from "@/lib/services/evaluation-service";
import { processCombo } from "@/lib/services/combo-service";
import { processEducational } from "@/lib/services/educational-service";
import { processDirect } from "@/lib/services/direct-service"; // ✅ Novo import

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

    // ✅ NOVA LÓGICA: Detectar tipos de plano
    const productType = paymentData.metadata.productType?.toLowerCase();
    const isMGTPlan = paymentData.plan.includes("MGT");
    const isDirectPlan = paymentData.plan.includes("DIRETO");

    console.log("[Pagar.me Webhook] Análise do tipo de produto:", {
      productType: paymentData.metadata.productType,
      courseId: paymentData.metadata.courseId,
      course_id: paymentData.metadata.course_id,
      planName: paymentData.plan,
      isMGTPlan: isMGTPlan ? "Sim" : "Não",
      isDirectPlan: isDirectPlan ? "Sim" : "Não", // ✅ Novo log
    });

    let processResult;

    // ✅ NOVA CONDIÇÃO: Verificar se é plano direto PRIMEIRO
    if (isDirectPlan) {
      console.log("[Pagar.me Webhook] 🚀 Processando como PLANO DIRETO");
      processResult = await processDirect({
        paymentData,
        hublaPaymentId: payment.hublaPaymentId,
      });
    } else if (productType === "combo") {
      // ✅ MANTIDO: Funcionalidade existente
      console.log(
        "[Pagar.me Webhook] Processando como COMBO (avaliação + educacional)"
      );
      processResult = await processCombo({
        paymentData,
        hublaPaymentId: payment.hublaPaymentId,
      });
    } else if (productType === "educational") {
      // ✅ MANTIDO: Funcionalidade existente
      console.log("[Pagar.me Webhook] Processando como EDUCACIONAL");
      processResult = await processEducational({
        paymentData,
        hublaPaymentId: payment.hublaPaymentId,
      });
    } else {
      // ✅ MANTIDO: Default para avaliação normal
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
      isDirectPlan: isDirectPlan, // ✅ Novo log
      autoCreatedPaidAccount: isDirectPlan, // ✅ Indica se criou conta automaticamente
    });

    console.log("=== FIM DO PROCESSAMENTO DO WEBHOOK PAGAR.ME ===\n");

    return Response.json({
      success: true,
      paymentId: payment.id,
      orderId: paymentData.orderId,
      processResult,
      planType: isDirectPlan ? "direct" : isMGTPlan ? "mgc" : "regular", // ✅ Novo campo
      autoCreatedPaidAccount: isDirectPlan, // ✅ Novo campo
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
