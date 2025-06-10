// lib/services/pagarme-webhook.ts
import {
  PagarmePaymentData,
  PagarmeWebhookPayload,
} from "@/app/types/pagarme-webhook";
import { processPlanName, extractPlatform } from "@/app/types"; // ✅ Import das funções helper

export class PagarmeWebhookService {
  private extractProductInfo(description: string): {
    platform: string;
    plan: string;
  } {
    // ✅ ATUALIZADO: Usar as funções helper para consistência
    console.log("[Pagarme Webhook Service] Descrição original:", description);

    const processedPlan = processPlanName(description);
    const extractedPlatform = extractPlatform(description);

    console.log("[Pagarme Webhook Service] Plano processado:", processedPlan);
    console.log(
      "[Pagarme Webhook Service] Plataforma extraída:",
      extractedPlatform
    );

    // ✅ Log detalhado para debugging
    console.log("[Pagarme Webhook Service] Detecções:", {
      original: description,
      plano: processedPlan,
      plataforma: extractedPlatform,
      isDirect: processedPlan.includes("DIRETO"),
      isMGT: processedPlan.includes("MGT"),
    });

    return {
      platform: extractedPlatform,
      plan: processedPlan,
    };
  }

  extractPaymentData(
    webhook: PagarmeWebhookPayload
  ): PagarmePaymentData | null {
    try {
      const charge = webhook.data.charges[0];

      // ✅ ATUALIZADO: Usar o método atualizado
      const { platform, plan } = this.extractProductInfo(
        webhook.data.items[0].description
      );

      // Parse order bumps se existirem
      let orderBumps = null;
      if (charge.metadata.order_bumps) {
        try {
          orderBumps = JSON.parse(charge.metadata.order_bumps);
        } catch (e) {
          console.warn("Erro ao fazer parse dos order bumps:", e);
        }
      }

      // Capturar courseId de qualquer um dos campos possíveis
      const courseId = charge.metadata.course_id || charge.metadata.courseId;
      console.log("[Pagarme Webhook Service] courseId encontrado:", courseId);

      const splitInfo = charge.last_transaction.split
        ? {
            affiliateId: charge.metadata.affiliate_id || undefined, // Convertemos null para undefined
            splitAmount:
              webhook.data.amount *
              (charge.last_transaction.split[1].amount / 100),
          }
        : undefined;

      // ✅ Retorna dados com plano processado
      const paymentData: PagarmePaymentData = {
        orderId: webhook.data.id,
        amount: webhook.data.amount,
        customerName: webhook.data.customer.name,
        customerEmail: webhook.data.customer.email,
        customerPhone: `${webhook.data.customer.phones.mobile_phone.area_code}${webhook.data.customer.phones.mobile_phone.number}`,
        customerDocument: webhook.data.customer.document,
        platform, // ✅ Usando plataforma processada
        plan, // ✅ Usando plano processado (pode incluir "DIRETO")
        status: webhook.data.status,
        saleDate: new Date(webhook.data.created_at),
        paymentMethod: charge.payment_method,
        metadata: {
          ...charge.metadata,
          productType: charge.metadata.productType,
          courseId: charge.metadata.course_id || charge.metadata.courseId,
          hasOrderBumps: charge.metadata.has_order_bumps === true,
          orderBumps, // Objeto parseado
          productName: charge.metadata.product_name,
          productDescription: charge.metadata.product_description,
          productId: charge.metadata.product_id,
          affiliate_id: charge.metadata.affiliate_id,
        },
        splitInfo,
      };

      // ✅ Log final do processamento
      console.log("[Pagarme Webhook Service] Dados finais processados:", {
        orderId: paymentData.orderId,
        plan: paymentData.plan,
        platform: paymentData.platform,
        isDirect: paymentData.plan.includes("DIRETO"),
        isMGT: paymentData.plan.includes("MGT"),
        productType: paymentData.metadata.productType,
      });

      return paymentData;
    } catch (error) {
      console.error("Erro ao extrair dados do webhook Pagar.me:", error);
      return null;
    }
  }
}
