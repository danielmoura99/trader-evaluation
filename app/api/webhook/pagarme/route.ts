// app/api/webhooks/pagarme/route.ts
import { NextRequest } from "next/server";
import { PagarmeWebhookService } from "@/lib/services/pagarme-webhook";
import { sendRegistrationEmail } from "@/lib/email-service";
import { prisma } from "@/lib/prisma";
import { validatePagarmeWebhook } from "@/lib/services/webhook-validator";

export async function POST(req: NextRequest) {
  try {
    console.log("\n=== INÍCIO DO PROCESSAMENTO DO WEBHOOK PAGAR.ME ===");

    // 1. Validar a assinatura do webhook
    const signature = req.headers.get("x-hub-signature");
    if (!signature) {
      console.log("[Pagar.me Webhook] Assinatura ausente");
      return Response.json({ error: "Assinatura ausente" }, { status: 401 });
    }

    const payload = await req.text();
    const isValid = validatePagarmeWebhook(signature, payload);

    if (!isValid) {
      console.log("[Pagar.me Webhook] Assinatura inválida");
      return Response.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    const webhookData = JSON.parse(payload);
    if (webhookData.type !== "order.paid") {
      return Response.json({ message: "Evento ignorado" });
    }

    const webhookService = new PagarmeWebhookService();
    const paymentData = webhookService.extractPaymentData(webhookData);

    if (!paymentData) {
      return Response.json(
        { error: "Dados de pagamento inválidos" },
        { status: 400 }
      );
    }

    // Criar o pagamento usando a estrutura existente
    const payment = await prisma.payment.create({
      data: {
        hublaPaymentId: paymentData.orderId, // Usando o campo existente
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

    // Enviar email de registro
    const registrationUrl = `${process.env.CLIENT_PORTAL_URL}/registration/${payment.id}`;

    try {
      await sendRegistrationEmail({
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        registrationUrl,
      });
    } catch (emailError) {
      console.error("[Pagar.me Webhook] Erro ao enviar email:", emailError);
    }

    return Response.json({
      success: true,
      paymentId: payment.id,
      registrationUrl,
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
