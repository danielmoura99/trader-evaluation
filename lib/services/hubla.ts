// lib/services/hubla.ts
import { HublaPaymentData, HublaWebhookPayload } from "@/app/types/hubla";
import { prisma } from "@/lib/prisma";

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

  // Verifica a assinatura do webhook
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hmac = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(payload)
      .digest("hex");
    
    return hmac === signature;
  }

  // Extrai os dados relevantes do webhook
  extractPaymentData(webhook: HublaWebhookPayload): HublaPaymentData | null {
    try {
      const item = webhook.data.order.items[0];
      if (!item?.metadata?.platform || !item?.metadata?.plan) {
        console.error("Metadados ausentes no item do pedido:", item);
        return null;
      }

      return {
        paymentId: webhook.data.id,
        platform: item.metadata.platform,
        plan: item.metadata.plan,
        amount: webhook.data.amount,
        customerEmail: webhook.data.customer.email,
        customerName: webhook.data.customer.name,
        customerTaxId: webhook.data.customer.tax_id,
        createdAt: new Date(webhook.created_at)
      };
    } catch (error) {
      console.error("Erro ao extrair dados do webhook:", error);
      return null;
    }
  }

  // Processa o pagamento e gera o link do formulário
  async processPayment(paymentData: HublaPaymentData) {
    try {
      // Salva o pagamento no banco
      const payment = await prisma.payment.create({
        data: {
          hublaPaymentId: paymentData.paymentId,
          platform: paymentData.platform,
          plan: paymentData.plan,
          amount: paymentData.amount,
          customerEmail: paymentData.customerEmail,
          customerName: paymentData.customerName,
          customerTaxId: paymentData.customerTaxId,
          status: "pending_registration",
          createdAt: paymentData.createdAt
        }
      });

      // Gera um token único para o formulário
      const formToken = crypto
        .createHash("sha256")
        .update(`${payment.id}-${Date.now()}`)
        .digest("hex")
        .slice(0, 32);

      // Atualiza o pagamento com o token
      await prisma.payment.update({
        where: { id: payment.id },
        data: { formToken }
      });

      // Retorna o link do formulário
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
      return `${baseUrl}/registration/${formToken}`;
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      throw error;
    }
  }

  // Valida o token do formulário
  async validateFormToken(token: string) {
    const payment = await prisma.payment.findFirst({
      where: {
        formToken: token,
        status: "pending_registration"
      }
    });

    return payment;
  }
}