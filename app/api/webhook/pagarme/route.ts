// app/api/webhooks/pagarme/route.ts
import { NextRequest } from "next/server";
import { PagarmeWebhookService } from "@/lib/services/pagarme-webhook";
import { sendRegistrationEmail } from "@/lib/email-service";
import { prisma } from "@/lib/prisma";
//import { validatePagarmeWebhook } from "@/lib/services/webhook-validator";

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

    const webhookService = new PagarmeWebhookService();
    const paymentData = webhookService.extractPaymentData(webhookData);

    if (!paymentData) {
      console.log("[Pagar.me Webhook] Dados de pagamento inválidos");
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
      console.log("[Pagar.me Webhook] Email de registro enviado com sucesso");
    } catch (emailError) {
      console.error("[Pagar.me Webhook] Erro ao enviar email:", emailError);
    }

    console.log("[Pagar.me Webhook] Processamento concluído:", {
      paymentId: payment.id,
      orderId: paymentData.orderId,
      status: payment.status,
    });

    console.log("=== FIM DO PROCESSAMENTO DO WEBHOOK PAGAR.ME ===\n");

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
