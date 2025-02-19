// lib/services/webhook-validator.ts
import crypto from "crypto";

export function validatePagarmeWebhook(
  signature: string,
  payload: string
): boolean {
  const webhookSecret = process.env.PAGARME_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("PAGARME_WEBHOOK_SECRET não configurado");
    return false;
  }

  try {
    const hmac = crypto.createHmac("sha256", webhookSecret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );
  } catch (error) {
    console.error("Erro na validação do webhook:", error);
    return false;
  }
}
