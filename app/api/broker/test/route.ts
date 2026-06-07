// app/api/broker/test/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { ProxyService } from "@/lib/services/proxy-service";
import { ensureAuthenticatedApiAccess } from "@/lib/security";

const NELOGICA_API_URL = "https://api-broker4.nelogica.com.br/request.php";

export async function GET() {
  try {
    const accessDenied = await ensureAuthenticatedApiAccess();
    if (accessDenied) {
      return accessDenied;
    }

    const proxyService = ProxyService.getInstance();
    const proxyInfo = proxyService.getProxyInfo();

    const axiosConfig: Record<string, unknown> = {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://tradershouse.com.br",
      },
      timeout: 10000,
      validateStatus: () => true,
    };

    if (proxyService.isEnabled()) {
      const proxyConfig = proxyService.getAxiosProxyConfig();
      if (proxyConfig) {
        axiosConfig.proxy = proxyConfig;
      }
    }

    let ipInfo = null;
    try {
      const ipResponse = await axios.get("https://api.ipify.org?format=json", {
        proxy: axiosConfig.proxy as never,
        timeout: 5000,
      });
      ipInfo = ipResponse.data;
    } catch (ipError) {
      console.error("[broker/test] Erro ao obter IP:", ipError);
    }

    const response = await axios.get(NELOGICA_API_URL, axiosConfig);

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
        ? "Conexao via Fixie funcionando"
        : "Conexao direta funcionando",
    });
  } catch (error) {
    console.error("[broker/test] Erro no teste:", {
      status:
        typeof error === "object" && error && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined,
      data:
        typeof error === "object" && error && "response" in error
          ? (error as { response?: { data?: unknown } }).response?.data
          : undefined,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    });

    return NextResponse.json(
      {
        success: false,
        error: "Falha no teste de conexao",
        details:
          typeof error === "object" && error && "response" in error
            ? (error as { response?: { data?: unknown } }).response?.data
            : error instanceof Error
              ? error.message
              : "Erro desconhecido",
        timestamp: new Date().toISOString(),
        proxyInfo: ProxyService.getInstance().getProxyInfo(),
      },
      {
        status:
          (typeof error === "object" &&
          error &&
          "response" in error &&
          (error as { response?: { status?: number } }).response?.status) ||
          500,
      }
    );
  }
}
