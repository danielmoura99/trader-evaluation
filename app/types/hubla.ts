// types/hubla.ts
export interface HublaUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface HublaInvoice {
  id: string;
  subscriptionId: string;
  payerId: string;
  status: string;
  amount: {
    totalCents: number;
  };
  saleDate: string;
}

export interface HublaProduct {
  id: string;
  name: string;
}

export interface HublaWebhookPayload {
  type: string;
  version: string;
  event: {
    product: HublaProduct;
    invoice: HublaInvoice;
    user: HublaUser;
  };
}

export interface HublaPaymentData {
  hublaPaymentId: string;
  subscriptionId: string;
  payerId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  platform: string;
  plan: string;
  status: string;
  saleDate: Date;
}
