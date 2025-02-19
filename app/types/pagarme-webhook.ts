// types/pagarme-webhook.ts
export interface PagarmeWebhookPayload {
  id: string;
  type: string;
  created_at: string;
  data: {
    created_at: string | number | Date;
    id: string;
    code: string;
    amount: number;
    currency: string;
    status: string;
    items: Array<{
      id: string;
      type: string;
      description: string;
      amount: number;
      quantity: number;
      status: string;
    }>;
    customer: {
      id: string;
      name: string;
      email: string;
      document: string;
      type: string;
      phones: {
        mobile_phone: {
          country_code: string;
          number: string;
          area_code: string;
        };
      };
    };
    charges: Array<{
      id: string;
      amount: number;
      status: string;
      payment_method: string;
      last_transaction: {
        split?: Array<{
          amount: number;
          recipient: {
            id: string;
            name: string;
            email: string;
            document: string;
          };
        }>;
      };
      metadata: {
        product_id: string;
        affiliate_id: string | null;
        product_name: string;
        product_description?: string;
      };
    }>;
  };
}

export interface PagarmePaymentData {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDocument: string;
  platform: string;
  plan: string;
  status: string;
  saleDate: Date;
  paymentMethod: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
  splitInfo?: {
    affiliateId: string | undefined;
    splitAmount?: number;
  };
}
