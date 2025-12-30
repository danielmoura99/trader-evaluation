/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/broker/test/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { ProxyService } from "@/lib/services/proxy-service";

// URL direta da API Nelogica (antiga API)
const NELOGICA_API_URL = "https://api-broker4.nelogica.com.br/request.php";

export async function GET() {
  try {
    console.log(
      "🧪 [test] Iniciando teste de conexão com Nelogica via Fixie..."
    );

    // Configurar proxy Fixie
    const proxyService = ProxyService.getInstance();
    const proxyInfo = proxyService.getProxyInfo();

    console.log("🔍 [test] Status do proxy:", proxyInfo);

    const axiosConfig: any = {
      headers: {
        "Content-Type": "application/json",
        // IMPORTANTE: Usar domínio de produção autorizado pela Nelogica
        // Mesmo em localhost, precisa usar o domínio registrado
        Origin: "https://tradershouse.com.br",
      },
      timeout: 10000,
      validateStatus: () => true, // Aceita qualquer status
    };

    // Adicionar proxy se disponível
    if (proxyService.isEnabled()) {
      const proxyConfig = proxyService.getAxiosProxyConfig();
      if (proxyConfig) {
        axiosConfig.proxy = proxyConfig;
        console.log("🔗 [test] Usando proxy Fixie");
      }
    } else {
      console.log("⚠️ [test] Proxy não configurado - usando conexão direta");
    }

    // Teste 1: Verificar IP público
    let ipInfo = null;
    try {
      console.log("🔍 [test] Verificando IP público...");
      const ipResponse = await axios.get("https://api.ipify.org?format=json", {
        proxy: axiosConfig.proxy,
        timeout: 5000,
      });
      ipInfo = ipResponse.data;
      console.log("✅ [test] IP detectado:", ipInfo);
    } catch (ipError) {
      console.error("⚠️ [test] Erro ao obter IP:", ipError);
    }

    // Teste 2: Tentar acessar a API da Nelogica
    const response = await axios.get(NELOGICA_API_URL, axiosConfig);

    console.log("✅ [test] Resposta da Nelogica:", response.status);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      proxyInfo,
      ipInfo,
      nelogicaResponse: {
        status: response.status,
        statusText: response.statusText,
      },
      message: proxyService.isEnabled()
        ? "✅ Conexão via Fixie funcionando - IP fixo ativo"
        : "⚠️ Conexão direta funcionando (configure FIXIE_URL para usar IP fixo)",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("❌ [test] Erro no teste:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Falha no teste de conexão",
        details: error.response?.data || error.message,
        timestamp: new Date().toISOString(),
        proxyInfo: ProxyService.getInstance().getProxyInfo(),
      },
      {
        status: error.response?.status || 500,
      }
    );
  }
}
