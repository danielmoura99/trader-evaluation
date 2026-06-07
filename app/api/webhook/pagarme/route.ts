// app/api/webhook/pagarme/route.ts
import { NextRequest } from "next/server";
import { PagarmeWebhookService } from "@/lib/services/pagarme-webhook";
import { prisma } from "@/lib/prisma";
import { processEvaluation } from "@/lib/services/evaluation-service";
import { processCombo } from "@/lib/services/combo-service";
import { processEducational } from "@/lib/services/educational-service";
import { sendRegistrationEmail } from "@/lib/email-service";

export async function POST(req: NextRequest) {
  try {
    console.log("\n=== INICIO DO PROCESSAMENTO DO WEBHOOK PAGAR.ME ===");

    const payload = await req.text();

    const webhookData = JSON.parse(payload);
    console.log("[Pagar.me Webhook] Evento recebido:", webhookData.type);

    if (webhookData.type !== "order.paid") {
      console.log("[Pagar.me Webhook] Evento ignorado:", webhookData.type);
      return Response.json({ message: "Evento ignorado" });
    }

    const metadata = webhookData.data?.metadata;
    if (
      metadata?.type === "platform_renewal" ||
      metadata?.service === "platform_renewal"
    ) {
      console.log(
        "[Pagar.me Webhook] Renovacao de plataforma detectada via metadata"
      );
      return Response.json({
        message: "Renovacao de plataforma - webhook ignorado",
        info: "Este webhook sera processado pelo endpoint de renovacoes",
      });
    }

    const webhookService = new PagarmeWebhookService();
    const paymentData = webhookService.extractPaymentData(webhookData);

    if (!paymentData) {
      console.log("[Pagar.me Webhook] Dados de pagamento invalidos");
      return Response.json(
        { error: "Dados de pagamento invalidos" },
        { status: 400 }
      );
    }

    const existingRenewal = await prisma.platformRenewal.findFirst({
      where: {
        paymentId: paymentData.orderId,
      },
    });

    if (existingRenewal) {
      console.log(
        "[Pagar.me Webhook] Renovacao de plataforma detectada via banco"
      );
      return Response.json({
        message: "Renovacao de plataforma detectada via banco - webhook ignorado",
        renewalId: existingRenewal.id,
        info: "Este webhook sera processado pelo endpoint de renovacoes",
      });
    }

    const payment = await prisma.payment.upsert({
      where: {
        hublaPaymentId: paymentData.orderId,
      },
      update: {
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
        updatedAt: new Date(),
      },
      create: {
        hublaPaymentId: paymentData.orderId,
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

    const productType = paymentData.metadata.productType?.toLowerCase();
    const isMGTPlan = paymentData.plan.includes("MGT");
    const isDirectPlan = paymentData.plan.includes("DIRETO");

    let processResult;

    if (isDirectPlan) {
      const registrationUrl = `${process.env.CLIENT_PORTAL_URL}/registration/${payment.hublaPaymentId}?isDirect=true`;

      try {
        await sendRegistrationEmail({
          customerName: paymentData.customerName,
          customerEmail: paymentData.customerEmail,
          registrationUrl,
        });

        processResult = {
          success: true,
          type: "direct",
          message: "Pagamento registrado e email enviado para plano direto",
          registrationUrl,
          emailSent: true,
          clientCreated: false,
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
      processResult = await processCombo({
        paymentData,
        hublaPaymentId: payment.hublaPaymentId,
      });
    } else if (productType === "educational") {
      processResult = await processEducational({
        paymentData,
        hublaPaymentId: payment.hublaPaymentId,
      });
    } else {
      processResult = await processEvaluation({
        paymentData,
        hublaPaymentId: payment.hublaPaymentId,
      });
    }

    console.log("[Pagar.me Webhook] Processamento concluido:", {
      type: processResult.type,
      success: processResult.success,
      emailSent: processResult.emailSent,
      isDirectPlan,
      clientCreatedInWebhook: !isDirectPlan,
    });

    console.log("=== FIM DO PROCESSAMENTO DO WEBHOOK PAGAR.ME ===\n");

    return Response.json({
      success: true,
      paymentId: payment.id,
      orderId: paymentData.orderId,
      processResult,
      planType: isDirectPlan ? "direct" : isMGTPlan ? "mgc" : "regular",
      clientCreatedInWebhook: !isDirectPlan,
    });
  } catch (error) {
    console.error("[Pagar.me Webhook] Erro critico:", error);
    return Response.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
