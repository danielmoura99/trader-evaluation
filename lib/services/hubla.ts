// lib/services/hubla.ts
import { prisma } from "@/lib/prisma";
import { HublaWebhookPayload, HublaPaymentData } from "@/app/types/hubla";
import crypto from "crypto";

export class HublaService {
  private webhookSecret: string;

  constructor() {
    const secret = process.env.HUBLA_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error("HUBLA_WEBHOOK_SECRET não configurado");
    }
    this.webhookSecret = secret;
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hmac = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(payload)
      .digest("hex");
    return hmac === signature;
  }

  extractPaymentData(webhook: HublaWebhookPayload): HublaPaymentData | null {
    try {
      if (webhook.type !== "invoice.payment_succeeded") {
        console.log("Tipo de evento ignorado:", webhook.type);
        return null;
      }

      // Extrair plataforma e plano do nome do produto
      const productParts = webhook.event.product.name
        .split("-")
        .map((p) => p.trim());
      const planPart = productParts[0]; // "Trader 50K"
      const platformPart = productParts[1]?.split("|")[0]?.trim(); // "Profit Pro"

      return {
        hublaPaymentId: webhook.event.invoice.id,
        subscriptionId: webhook.event.invoice.subscriptionId,
        payerId: webhook.event.invoice.payerId,
        amount: webhook.event.invoice.amount.totalCents,
        customerName:
          `${webhook.event.user.firstName} ${webhook.event.user.lastName}`.trim(),
        customerEmail: webhook.event.user.email,
        customerPhone: webhook.event.user.phone,
        platform: platformPart || "Não especificado",
        plan: planPart || "Não especificado",
        status: webhook.event.invoice.status,
        saleDate: new Date(webhook.event.invoice.saleDate),
      };
    } catch (error) {
      console.error("Erro ao extrair dados do webhook:", error);
      return null;
    }
  }

  async processPayment(paymentData: HublaPaymentData) {
    try {
      // Salva o pagamento no banco
      const payment = await prisma.payment.create({
        data: {
          hublaPaymentId: paymentData.hublaPaymentId,
          platform: paymentData.platform,
          plan: paymentData.plan,
          amount: paymentData.amount,
          customerEmail: paymentData.customerEmail,
          customerName: paymentData.customerName,
          customerPhone: paymentData.customerPhone,
          status: "received",
          saleDate: paymentData.saleDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log("Pagamento salvo no banco:", {
        id: payment.id,
        hublaPaymentId: payment.hublaPaymentId,
        status: payment.status,
      });

      return payment;
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      throw error;
    }
  }
}
