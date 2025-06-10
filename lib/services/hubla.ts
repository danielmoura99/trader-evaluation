// lib/services/hubla.ts
import { prisma } from "@/lib/prisma";
import { HublaWebhookPayload, HublaPaymentData } from "@/app/types/hubla";
import { processPlanName, extractPlatform } from "@/app/types";
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
      // Ignora faturas de order bump (offer-1, offer-2)
      if (webhook.event.invoice.id.includes("-offer-")) {
        console.log("Order bump ignorado:", webhook.event.invoice.id);
        return null;
      }

      // Verificar tipo do evento e status
      if (
        webhook.type !== "invoice.payment_succeeded" ||
        webhook.event.invoice.status !== "paid"
      ) {
        console.log("Evento ignorado ou status inválido:", {
          type: webhook.type,
          status: webhook.event.invoice.status,
        });
        return null;
      }

      // Log para debug
      console.log("Processando webhook:", {
        tipo: webhook.type,
        produto: webhook.event.product.name,
        usuario: webhook.event.user,
      });

      // ✅ NOVA LÓGICA: Usar funções helper para processar nomes
      const productName = webhook.event.product.name;
      console.log("[Hubla Service] Nome do produto original:", productName);

      // Processar plano usando a função helper
      const processedPlan = processPlanName(productName);
      console.log("[Hubla Service] Plano processado:", processedPlan);

      // Extrair plataforma usando a função helper
      const extractedPlatform = extractPlatform(productName);
      console.log("[Hubla Service] Plataforma extraída:", extractedPlatform);

      // Tratamento para documento (pode não existir em ambiente de teste)
      const customerDocument = webhook.event.user.document
        ? webhook.event.user.document.replace(/[^\d]/g, "")
        : "00000000000"; // CPF padrão para testes

      const paymentData: HublaPaymentData = {
        hublaPaymentId: webhook.event.invoice.id,
        subscriptionId: webhook.event.invoice.subscriptionId,
        payerId: webhook.event.invoice.payerId,
        amount: webhook.event.invoice.amount.totalCents,
        customerName:
          `${webhook.event.user.firstName} ${webhook.event.user.lastName}`.trim(),
        customerEmail: webhook.event.user.email,
        customerPhone: webhook.event.user.phone,
        customerDocument: customerDocument,
        platform: extractedPlatform,
        plan: processedPlan, // ✅ Usando o plano processado
        status: webhook.event.invoice.status,
        saleDate: new Date(webhook.event.invoice.saleDate),
        paymentMethod: webhook.event.invoice.paymentMethod,
      };

      // ✅ Log detalhado do processamento
      console.log("[Hubla Service] Dados processados:", {
        original: productName,
        plano: processedPlan,
        plataforma: extractedPlatform,
        isDirect: processedPlan.includes("DIRETO"),
        isMGT: processedPlan.includes("MGT"),
      });

      return paymentData;
    } catch (error) {
      console.error("Erro ao extrair dados do webhook:", error);
      console.error("Payload recebido:", webhook);
      return null;
    }
  }

  async processPayment(paymentData: HublaPaymentData) {
    try {
      // Verifica se já existe um pagamento com este ID
      const existingPayment = await prisma.payment.findUnique({
        where: { hublaPaymentId: paymentData.hublaPaymentId },
      });

      if (existingPayment) {
        console.log(
          "Pagamento já processado anteriormente:",
          existingPayment.id
        );
        return existingPayment;
      }

      // Salva o novo pagamento
      const payment = await prisma.payment.create({
        data: {
          hublaPaymentId: paymentData.hublaPaymentId,
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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log("Novo pagamento processado:", {
        id: payment.id,
        hublaPaymentId: payment.hublaPaymentId,
        status: payment.status,
        platform: payment.platform,
        plan: payment.plan,
      });

      return payment;
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      throw error;
    }
  }
}
