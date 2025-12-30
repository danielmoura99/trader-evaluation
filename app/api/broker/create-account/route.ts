/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/broker/create-account/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { ProxyService } from "@/lib/services/proxy-service";

// URL direta da API Nelogica (antiga API)
const NELOGICA_API_URL = "https://api-broker4.nelogica.com.br/request.php";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("📋 [create-account] Payload recebido:", payload);

    // Configurar proxy Fixie
    const proxyService = ProxyService.getInstance();
    const axiosConfig: any = {
      headers: {
        "Content-Type": "application/json",
        // IMPORTANTE: Usar domínio de produção autorizado pela Nelogica
        // Mesmo em localhost, precisa usar o domínio registrado
        Origin: "https://tradershouse.com.br",
      },
    };

    // Adicionar proxy se disponível
    if (proxyService.isEnabled()) {
      const proxyConfig = proxyService.getAxiosProxyConfig();
      if (proxyConfig) {
        axiosConfig.proxy = proxyConfig;
        console.log(
          "🔗 [create-account] Usando proxy Fixie:",
          proxyService.getProxyInfo()
        );
      }
    } else {
      console.log(
        "⚠️ [create-account] Proxy não configurado - usando conexão direta"
      );
    }

    // Payload final com authenticationCode
    const finalPayload = {
      ...payload,
      authenticationCode: "2B295526980F475BA2A608C8C1C4F8DF",
    };

    console.log("📤 [create-account] Enviando para Nelogica:", finalPayload);

    // Fazer requisição direta para a Nelogica via Fixie
    const response = await axios.post(
      NELOGICA_API_URL,
      finalPayload,
      axiosConfig
    );

    console.log("✅ [create-account] Resposta da Nelogica:", response.data);
    return NextResponse.json(response.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("❌ [create-account] Erro detalhado:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Falha ao criar conta na corretora",
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
