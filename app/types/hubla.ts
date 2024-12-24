// types/hubla.ts
export interface HublaWebhookPayload {
  id: string; // ID da transação na Hubla
  event_type: string; // Tipo do evento (ex: "payment.succeeded")
  created_at: string; // Data de criação
  data: {
    id: string; // ID do pagamento
    status: string; // Status do pagamento
    amount: number; // Valor em centavos
    payment_method: string; // Método de pagamento
    order: {
      id: string; // ID do pedido
      items: Array<{
        id: string; // ID do item
        name: string; // Nome do produto
        quantity: number; // Quantidade
        unit_amount: number; // Valor unitário em centavos
        metadata: {
          platform?: string; // Plataforma escolhida
          plan?: string; // Plano escolhido
        };
      }>;
    };
    customer: {
      id: string; // ID do cliente na Hubla
      email: string; // Email do cliente
      name: string; // Nome do cliente
      tax_id: string; // CPF/CNPJ
    };
  };
}

export interface HublaPaymentData {
  paymentId: string;
  platform: string;
  plan: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  customerTaxId: string;
  createdAt: Date;
}
