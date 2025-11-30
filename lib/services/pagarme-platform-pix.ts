// lib/services/pagarme-platform-pix.ts
// Serviço dedicado para geração de PIX de RENOVAÇÃO DE PLATAFORMA via Pagarme
// Separado do pagarme-pix-service.ts (que é para compra de avaliação)

import { PlatformRenewalData } from "./platform-renewal-service";

/**
 * Interface de resposta do Pagarme ao criar order de renovação
 */
export interface PagarmePlatformPixResponse {
  success: boolean;
  orderId: string;
  pixCode: string;
  pixQrCode: string;
  amount: number;
  expiresAt: Date;
  status: string;
}

/**
 * Gerar PIX via Pagarme especificamente para RENOVAÇÃO DE PLATAFORMA
 *
 * Documentação Pagarme Orders API: https://docs.pagar.me/reference/criar-pedido
 */
export async function generatePlatformRenewalPix(
  renewalData: PlatformRenewalData
): Promise<PagarmePlatformPixResponse> {
  const pagarmeApiKey = process.env.PAGARME_API_KEY;

  if (!pagarmeApiKey) {
    throw new Error("PAGARME_API_KEY não configurada no .env");
  }

  console.log("[Pagarme Platform PIX] Gerando PIX de renovação:", {
    entityId: renewalData.entityId,
    renewalType: renewalData.renewalType,
    platform: renewalData.platform,
    amount: renewalData.amount,
  });

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
        description: `Renovação Plataforma ${renewalData.platform} - 30 dias`,
        quantity: 1,
        code: `renewal_${renewalData.platform.toLowerCase()}`,
      },
    ],
    payments: [
      {
        payment_method: "pix",
        pix: {
          expires_in: 3600, // 1 hora para pagamento
        },
      },
    ],
    metadata: {
      type: "platform_renewal", // Identificador de renovação
      renewalType: renewalData.renewalType,
      entityId: renewalData.entityId,
      platform: renewalData.platform,
      service: "platform_renewal", // Para diferenciar de avaliações
      customerName: renewalData.customerName, // Nome do cliente
      customerDocument: renewalData.customerCpf.replace(/\D/g, ""), // CPF sem formatação
    },
    closed: true, // Order fechada (não permite edição)
  };

  try {
    console.log("[Pagarme Platform PIX] Enviando request para Pagarme...");

    // Pagarme usa Basic Auth (API Key com : no final, codificado em base64)
    const authToken = Buffer.from(`${pagarmeApiKey}:`).toString("base64");

    // Fazer requisição para Pagarme API
    const response = await fetch("https://api.pagar.me/core/v5/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Pagarme Platform PIX] Erro na resposta:", errorData);
      throw new Error(
        `Erro ao gerar PIX: ${errorData.message || response.statusText}`
      );
    }

    const data = await response.json();

    console.log("[Pagarme Platform PIX] Order criada:", {
      orderId: data.id,
      status: data.status,
    });

    // Log completo para debug
    console.log("[Pagarme Platform PIX] Resposta completa:",
      JSON.stringify(data, null, 2)
    );

    // Verificar se order falhou
    if (data.status === 'failed') {
      console.error("[Pagarme Platform PIX] Order falhou!");

      // Tentar extrair mensagem de erro detalhada
      const charge = data.charges?.[0];
      const transaction = charge?.last_transaction;
      const errors = transaction?.gateway_response?.errors;

      let errorMessage = "Order criada mas falhou";

      if (errors && errors.length > 0) {
        errorMessage = errors.map((e: { message: string }) => e.message).join(", ");
      } else if (transaction?.acquirer_message) {
        errorMessage = transaction.acquirer_message;
      } else if (charge?.last_transaction_error) {
        errorMessage = charge.last_transaction_error;
      }

      console.error("[Pagarme Platform PIX] Erro detalhado:", errorMessage);
      throw new Error(`Pagarme: ${errorMessage}`);
    }

    // Extrair dados do PIX da transação
    const pixPayment = data.charges?.[0]?.last_transaction;

    if (!pixPayment || !pixPayment.qr_code) {
      console.error("[Pagarme Platform PIX] Estrutura inválida:", {
        hasCharges: !!data.charges,
        chargesLength: data.charges?.length,
        hasTransaction: !!data.charges?.[0]?.last_transaction,
        hasQrCode: !!data.charges?.[0]?.last_transaction?.qr_code,
      });
      throw new Error("PIX não foi gerado corretamente pela Pagarme");
    }

    const expiresAt = new Date(pixPayment.expires_at);

    console.log("[Pagarme Platform PIX] PIX gerado:", {
      qrCode: pixPayment.qr_code_url ? "✅" : "❌",
      expiresAt: expiresAt.toISOString(),
    });

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
    console.error("[Pagarme Platform PIX] Erro ao gerar PIX:", error);
    throw error;
  }
}

/**
 * Consultar status de um pedido (order) no Pagarme
 */
export async function checkPlatformOrderStatus(orderId: string) {
  const pagarmeApiKey = process.env.PAGARME_API_KEY;

  if (!pagarmeApiKey) {
    throw new Error("PAGARME_API_KEY não configurada no .env");
  }

  try {
    // Pagarme usa Basic Auth (API Key com : no final, codificado em base64)
    const authToken = Buffer.from(`${pagarmeApiKey}:`).toString("base64");

    const response = await fetch(
      `https://api.pagar.me/core/v5/orders/${orderId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao consultar pedido: ${response.statusText}`);
    }

    const data = await response.json();

    console.log("[Pagarme Platform PIX] Status do pedido:", {
      orderId: data.id,
      status: data.status,
      paidAt: data.charges[0]?.paid_at || null,
    });

    return {
      orderId: data.id,
      status: data.status,
      amount: data.amount,
      paidAt: data.charges[0]?.paid_at,
      metadata: data.metadata,
    };
  } catch (error) {
    console.error("[Pagarme Platform PIX] Erro ao consultar status:", error);
    throw error;
  }
}
