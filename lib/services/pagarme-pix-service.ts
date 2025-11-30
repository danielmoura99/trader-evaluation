// lib/services/pagarme-pix-service.ts
// Serviço para integração com Pagarme - Geração de PIX

import { PlatformRenewalData } from "./platform-renewal-service";

/**
 * Interface de resposta do Pagarme ao criar order
 */
export interface PagarmePixResponse {
  success: boolean;
  orderId: string;
  pixCode: string;
  pixQrCode: string;
  amount: number;
  expiresAt: Date;
  status: string;
}

/**
 * Gerar PIX via Pagarme para renovação de plataforma
 */
export async function generatePixForRenewal(
  renewalData: PlatformRenewalData
): Promise<PagarmePixResponse> {
  const pagarmeApiKey = process.env.PAGARME_API_KEY;

  if (!pagarmeApiKey) {
    throw new Error("PAGARME_API_KEY não configurada no .env");
  }

  // Preparar payload para Pagarme Orders API
  const payload = {
    customer: {
      name: renewalData.customerName,
      email: renewalData.customerEmail,
      document: renewalData.customerCpf.replace(/\D/g, ""), // Remover formatação
      type: "individual",
    },
    items: [
      {
        amount: renewalData.amount, // Valor em centavos
        description: `Renovação de Plataforma - ${renewalData.platform}`,
        quantity: 1,
      },
    ],
    payments: [
      {
        payment_method: "pix",
        pix: {
          expires_in: 3600, // 1 hora em segundos
        },
      },
    ],
    metadata: renewalData.metadata,
    closed: true,
  };

  try {
    // Fazer requisição para Pagarme API
    const response = await fetch("https://api.pagar.me/core/v5/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pagarmeApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Pagarme PIX] Erro na resposta:", errorData);
      throw new Error(
        `Erro ao gerar PIX: ${errorData.message || response.statusText}`
      );
    }

    const data = await response.json();

    // Extrair dados do PIX
    const pixPayment = data.charges[0].last_transaction;

    const expiresAt = new Date(pixPayment.expires_at);

    return {
      success: true,
      orderId: data.id,
      pixCode: pixPayment.qr_code,
      pixQrCode: pixPayment.qr_code_url,
      amount: renewalData.amount,
      expiresAt,
      status: data.status,
    };
  } catch (error) {
    console.error("[Pagarme PIX] Erro ao gerar PIX:", error);
    throw error;
  }
}

/**
 * Consultar status de um pedido (order) no Pagarme
 */
export async function checkOrderStatus(orderId: string) {
  const pagarmeApiKey = process.env.PAGARME_API_KEY;

  if (!pagarmeApiKey) {
    throw new Error("PAGARME_API_KEY não configurada no .env");
  }

  try {
    const response = await fetch(
      `https://api.pagar.me/core/v5/orders/${orderId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${pagarmeApiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao consultar pedido: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      orderId: data.id,
      status: data.status,
      amount: data.amount,
      paidAt: data.charges[0]?.paid_at,
    };
  } catch (error) {
    console.error("[Pagarme PIX] Erro ao consultar status:", error);
    throw error;
  }
}
