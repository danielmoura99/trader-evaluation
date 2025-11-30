// lib/services/btg-pix-service.ts

/**
 * Serviço para criar cobranças PIX via BTG Pactual
 *
 * Documentação: https://developers.empresas.btgpactual.com/reference/pix-cobrança
 */

import { getValidAccessToken } from "./btg-auth-service";

const BTG_API_BASE_URL = process.env.BTG_API_BASE_URL || "https://api.sandbox.empresas.btgpactual.com/v1";
const BTG_COMPANY_ID = process.env.BTG_COMPANY_ID;
const BTG_MOCK_MODE = process.env.BTG_MOCK_MODE === "true"; // Modo de teste sem BTG real

interface PixChargeRequest {
  txId: string; // ID único da transação (26-35 caracteres alfanuméricos)
  amount: number; // Valor em centavos (ex: 9850 = R$ 98,50)
  debtor?: {
    cpf?: string;
    cnpj?: string;
    name: string;
  };
  expiresIn?: number; // Tempo de expiração em segundos (padrão: 3600 = 1 hora)
  additionalInfo?: Array<{
    key: string;
    value: string;
  }>;
}

interface PixChargeResponse {
  txId: string;
  status: string;
  location: string;
  emv: string; // Código PIX Copia e Cola
  qrCode?: string; // URL do QR Code (se disponível)
  expiresAt: string;
  createdAt: string;
}

/**
 * Gera um txId único para a transação
 * Formato: 26-35 caracteres alfanuméricos
 */
function generateTxId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${random}`.substring(0, 35).toUpperCase();
}

/**
 * Cria uma cobrança PIX no BTG
 */
export async function createPixCharge(
  data: PixChargeRequest
): Promise<PixChargeResponse> {
  // Modo de desenvolvimento: retornar dados mockados
  if (BTG_MOCK_MODE) {
    console.log("[BTG PIX] Running in MOCK mode - returning fake PIX data");
    return {
      txId: data.txId,
      status: "ATIVA",
      location: "pix.example.com/qr/v2/mockpix123",
      emv: "00020126580014br.gov.bcb.pix0136a629532e-7693-4846-852d-1bbf393ce2205204000053039865802BR5925TRADERS HOUSE LTDA6009SAO PAULO62410503***63041D3D",
      qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020126580014br.gov.bcb.pix",
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hora
      createdAt: new Date().toISOString(),
    };
  }

  if (!BTG_COMPANY_ID) {
    throw new Error("BTG_COMPANY_ID not configured in environment variables");
  }

  const accessToken = await getValidAccessToken();

  const requestBody = {
    calendario: {
      expiracao: data.expiresIn || 3600, // 1 hora padrão
    },
    devedor: data.debtor
      ? {
          cpf: data.debtor.cpf,
          cnpj: data.debtor.cnpj,
          nome: data.debtor.name,
        }
      : undefined,
    valor: {
      original: (data.amount / 100).toFixed(2), // Converte centavos para reais
    },
    chave: BTG_COMPANY_ID, // Chave PIX da conta (pode ser diferente, verificar documentação)
    solicitacaoPagador: "Renovação de plataforma - Traders House",
    infoAdicionais: data.additionalInfo?.map((info) => ({
      nome: info.key,
      valor: info.value,
    })),
  };

  const response = await fetch(
    `${BTG_API_BASE_URL}/companies/${BTG_COMPANY_ID}/pix-cash-in/instant-collections`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        ...requestBody,
        txid: data.txId,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("[BTG PIX] Error creating charge:", error);
    throw new Error(`BTG PIX Error: ${response.status} - ${error}`);
  }

  const result = await response.json();

  return {
    txId: result.txid || data.txId,
    status: result.status || "ATIVA",
    location: result.location || "",
    emv: result.pixCopiaECola || result.emv || "",
    qrCode: result.qrcode || result.imagemQrcode,
    expiresAt: result.calendario?.criacao
      ? new Date(
          Date.parse(result.calendario.criacao) +
            (result.calendario.expiracao || 3600) * 1000
        ).toISOString()
      : new Date(Date.now() + 3600000).toISOString(),
    createdAt: result.calendario?.criacao || new Date().toISOString(),
  };
}

/**
 * Consulta uma cobrança PIX pelo txId
 */
export async function getPixCharge(txId: string): Promise<PixChargeResponse> {
  if (!BTG_COMPANY_ID) {
    throw new Error("BTG_COMPANY_ID not configured");
  }

  const accessToken = await getValidAccessToken();

  const response = await fetch(
    `${BTG_API_BASE_URL}/companies/${BTG_COMPANY_ID}/pix-cash-in/instant-collections/${txId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`BTG PIX Get Error: ${response.status} - ${error}`);
  }

  const result = await response.json();

  return {
    txId: result.txid,
    status: result.status,
    location: result.location,
    emv: result.pixCopiaECola || result.emv,
    qrCode: result.qrcode || result.imagemQrcode,
    expiresAt: result.calendario?.expiracao,
    createdAt: result.calendario?.criacao,
  };
}

/**
 * Helper para criar cobrança de renovação de plataforma
 */
export async function createPlatformRenewalCharge(params: {
  platform: string;
  clientName: string;
  clientCpf: string;
  evaluationId: string;
}): Promise<PixChargeResponse> {
  // Determinar valor baseado na plataforma
  const amount = params.platform === "Profit One" ? 9850 : 22600; // R$ 98,50 ou R$ 226,00

  const txId = generateTxId();

  return await createPixCharge({
    txId,
    amount,
    debtor: {
      cpf: params.clientCpf.replace(/\D/g, ""),
      name: params.clientName,
    },
    expiresIn: 3600, // 1 hora
    additionalInfo: [
      {
        key: "evaluationId",
        value: params.evaluationId,
      },
      {
        key: "platform",
        value: params.platform,
      },
      {
        key: "type",
        value: "platform_renewal",
      },
    ],
  });
}

export { generateTxId };
