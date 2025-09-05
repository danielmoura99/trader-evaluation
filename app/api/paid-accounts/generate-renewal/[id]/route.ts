// app/api/paid-accounts/generate-renewal/[id]/route.ts
// API para gerar cobrança de renovação

import { NextRequest } from "next/server";
import {
  prepareRenewalData,
  createPendingRenewal,
} from "@/lib/renewal-service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paidAccountId = params.id;

    if (!paidAccountId) {
      return Response.json(
        { error: "ID da conta remunerada é obrigatório" },
        { status: 400 }
      );
    }

    // Preparar dados para renovação
    const renewalData = await prepareRenewalData(paidAccountId);

    if (!renewalData) {
      return Response.json(
        {
          error: "Conta não elegível para renovação",
          details:
            "A renovação só está disponível 3 dias antes do vencimento ou após vencimento",
        },
        { status: 400 }
      );
    }

    // Aqui você faria a integração com seu sistema de gateway/vendas
    // Por enquanto, vamos simular a resposta do gateway

    // TODO: Integrar com sistema de vendas real
    // const checkoutResponse = await createCheckoutInGateway(renewalData);

    // Simulação da resposta do gateway
    const simulatedPaymentId = `renewal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const simulatedCheckoutUrl = `https://checkout.pagarme.com.br/renewal/${simulatedPaymentId}`;

    // Criar registro de renovação pendente
    const renewalId = await createPendingRenewal(
      renewalData.paidAccountId,
      simulatedPaymentId,
      renewalData.amount,
      renewalData.platform
    );

    return Response.json({
      success: true,
      renewal: {
        id: renewalId,
        paymentId: simulatedPaymentId,
        amount: renewalData.amount,
        platform: renewalData.platform,
        checkoutUrl: simulatedCheckoutUrl,
      },
      client: {
        name: renewalData.clientName,
        email: renewalData.clientEmail,
      },
      metadata: renewalData.metadata,
    });
  } catch (error) {
    console.error("[Generate Renewal API] Erro:", error);
    return Response.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// Função auxiliar para integração futura com gateway real
//async function createCheckoutInGateway(renewalData: any) {
// TODO: Implementar integração real com sistema de vendas
// Exemplo de payload que seria enviado:
/*
  const payload = {
    product: `Renovação ${renewalData.platform}`,
    amount: renewalData.amount,
    customer: {
      name: renewalData.clientName,
      email: renewalData.clientEmail
    },
    metadata: renewalData.metadata,
    callback_url: `${process.env.NEXTAUTH_URL}/api/webhooks/renewal-payment`,
    success_url: `${process.env.PORTAL_CLIENT_URL}/renewal/success`,
    cancel_url: `${process.env.PORTAL_CLIENT_URL}/renewal/cancel`
  };

  const response = await fetch(`${process.env.GATEWAY_API_URL}/checkout/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GATEWAY_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  return await response.json();
  */
//}
