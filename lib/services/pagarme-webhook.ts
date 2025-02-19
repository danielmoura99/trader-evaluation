// lib/services/pagarme-webhook.ts
import {
  PagarmePaymentData,
  PagarmeWebhookPayload,
} from "@/app/types/pagarme-webhook";

export class PagarmeWebhookService {
  private extractProductInfo(description: string): {
    platform: string;
    plan: string;
  } {
    // Similar ao método da Hubla
    const parts = description.split("-").map((p) => p.trim());
    let plan = parts[0]; // "Trader 500K"
    const platform = parts[1]?.split("|")[0]?.trim() || "Não especificado"; // "Profit One"

    if (plan) {
      const matchPlan = plan.match(/Trader (\d+K)/);
      if (matchPlan) {
        plan = `TC - ${matchPlan[1]}`;
      }
    }

    return {
      platform,
      plan: plan || "Não especificado",
    };
  }

  extractPaymentData(
    webhook: PagarmeWebhookPayload
  ): PagarmePaymentData | null {
    try {
      const charge = webhook.data.charges[0];
      const { platform, plan } = this.extractProductInfo(
        webhook.data.items[0].description
      );

      const splitInfo = charge.last_transaction.split
        ? {
            affiliateId: charge.metadata.affiliate_id || undefined, // Convertemos null para undefined
            splitAmount:
              webhook.data.amount *
              (charge.last_transaction.split[1].amount / 100),
          }
        : undefined;

      return {
        orderId: webhook.data.id,
        amount: webhook.data.amount,
        customerName: webhook.data.customer.name,
        customerEmail: webhook.data.customer.email,
        customerPhone: `${webhook.data.customer.phones.mobile_phone.area_code}${webhook.data.customer.phones.mobile_phone.number}`,
        customerDocument: webhook.data.customer.document,
        platform,
        plan,
        status: webhook.data.status,
        saleDate: new Date(webhook.data.created_at),
        paymentMethod: charge.payment_method,
        metadata: charge.metadata,
        splitInfo,
      };
    } catch (error) {
      console.error("Erro ao extrair dados do webhook Pagar.me:", error);
      return null;
    }
  }
}
