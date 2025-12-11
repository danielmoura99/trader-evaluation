// app/api/webhook/pagarme/route.ts
import { NextRequest } from "next/server";
import { PagarmeWebhookService } from "@/lib/services/pagarme-webhook";
import { prisma } from "@/lib/prisma";
import { processEvaluation } from "@/lib/services/evaluation-service";
import { processCombo } from "@/lib/services/combo-service";
import { processEducational } from "@/lib/services/educational-service";
// ✅ REMOVIDO: import { processDirect } from "@/lib/services/direct-service";
import { sendRegistrationEmail } from "@/lib/email-service"; // ✅ Adicionado

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

    // ✅ FILTRO 1: Ignorar webhooks de RENOVAÇÃO DE PLATAFORMA (via metadata)
    const metadata = webhookData.data?.metadata;
    if (metadata?.type === "platform_renewal" || metadata?.service === "platform_renewal") {
      console.log(
        "[Pagar.me Webhook] ⚠️ Renovação de plataforma detectada via metadata - Ignorando (será processado por /api/webhook/pagarme-platform-renewal)"
      );
      return Response.json({
        message: "Renovação de plataforma - webhook ignorado",
        info: "Este webhook será processado pelo endpoint de renovações",
      });
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

    // ✅ FILTRO 2: Verificar no DB se este orderId é uma renovação (proteção caso metadata falhe)
    const existingRenewal = await prisma.platformRenewal.findFirst({
      where: {
        paymentId: paymentData.orderId,
      },
    });

    if (existingRenewal) {
      console.log(
        "[Pagar.me Webhook] ⚠️ Renovação de plataforma detectada via DB - Ignorando (será processado por /api/webhook/pagarme-platform-renewal)"
      );
      return Response.json({
        message: "Renovação de plataforma detectada via DB - webhook ignorado",
        renewalId: existingRenewal.id,
        info: "Este webhook será processado pelo endpoint de renovações",
      });
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

    // ✅ CORRIGIDO: Detectar tipos de plano
    const productType = paymentData.metadata.productType?.toLowerCase();
    const isMGTPlan = paymentData.plan.includes("MGT");
    const isDirectPlan = paymentData.plan.includes("DIRETO");

    console.log("[Pagar.me Webhook] Análise do tipo de produto:", {
      productType: paymentData.metadata.productType,
      courseId: paymentData.metadata.courseId,
      course_id: paymentData.metadata.course_id,
      planName: paymentData.plan,
      isMGTPlan: isMGTPlan ? "Sim" : "Não",
      isDirectPlan: isDirectPlan ? "Sim" : "Não",
    });

    let processResult;

    // ✅ CORRIGIDO: Planos DIRETO agora só registram pagamento e enviam email
    if (isDirectPlan) {
      console.log(
        "[Pagar.me Webhook] 🚀 Processando como PLANO DIRETO - Apenas registro"
      );

      // ✅ Para planos DIRETO: apenas enviar email, o cliente será criado na API de registro
      const registrationUrl = `${process.env.CLIENT_PORTAL_URL}/registration/${payment.hublaPaymentId}?isDirect=true`;

      try {
        await sendRegistrationEmail({
          customerName: paymentData.customerName,
          customerEmail: paymentData.customerEmail,
          registrationUrl,
        });

        console.log(
          "[Pagar.me Webhook] Email de registro DIRETO enviado com sucesso"
        );

        processResult = {
          success: true,
          type: "direct",
          message: "Pagamento registrado e email enviado para plano direto",
          registrationUrl,
          emailSent: true,
          clientCreated: false, // ✅ Cliente será criado na API de registro
        };
      } catch (emailError) {
        console.error(
          "[Pagar.me Webhook] Erro ao enviar email DIRETO:",
          emailError
        );

        processResult = {
          success: false,
          type: "direct",
          message: "Pagamento registrado, mas falha no envio do email",
          emailSent: false,
        };
      }
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
      isDirectPlan: isDirectPlan,
      clientCreatedInWebhook: isDirectPlan ? false : true, // ✅ Clientes DIRETO não são criados no webhook
    });

    console.log("=== FIM DO PROCESSAMENTO DO WEBHOOK PAGAR.ME ===\n");

    return Response.json({
      success: true,
      paymentId: payment.id,
      orderId: paymentData.orderId,
      processResult,
      planType: isDirectPlan ? "direct" : isMGTPlan ? "mgc" : "regular",
      clientCreatedInWebhook: !isDirectPlan, // ✅ Indica onde o cliente foi/será criado
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
