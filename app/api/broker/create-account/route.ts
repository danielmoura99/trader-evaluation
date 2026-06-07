// app/api/broker/create-account/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { ProxyService } from "@/lib/services/proxy-service";
import { ensureAuthenticatedApiAccess } from "@/lib/security";

const NELOGICA_API_URL = "https://api-broker4.nelogica.com.br/request.php";
const BROKER_TOKEN = process.env.BROKER_TOKEN;

export async function POST(req: Request) {
  try {
    const accessDenied = await ensureAuthenticatedApiAccess();
    if (accessDenied) {
      return accessDenied;
    }

    if (!BROKER_TOKEN) {
      return NextResponse.json(
        { error: "BROKER_TOKEN nao configurado" },
        { status: 500 }
      );
    }

    const payload = await req.json();
    console.log("[create-account] Solicitacao recebida");

    const proxyService = ProxyService.getInstance();
    const axiosConfig: Record<string, unknown> = {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://tradershouse.com.br",
      },
    };

    if (proxyService.isEnabled()) {
      const proxyConfig = proxyService.getAxiosProxyConfig();
      if (proxyConfig) {
        axiosConfig.proxy = proxyConfig;
        console.log("[create-account] Usando proxy Fixie");
      }
    } else {
      console.log("[create-account] Proxy nao configurado - usando conexao direta");
    }

    const finalPayload = {
      ...payload,
      authenticationCode: BROKER_TOKEN,
    };

    const response = await axios.post(
      NELOGICA_API_URL,
      finalPayload,
      axiosConfig
    );

    console.log("[create-account] Resposta recebida da Nelogica");
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("[create-account] Erro detalhado:", {
      message: error instanceof Error ? error.message : "Erro desconhecido",
      response:
        typeof error === "object" && error && "response" in error
          ? (error as { response?: { data?: unknown } }).response?.data
          : undefined,
      status:
        typeof error === "object" && error && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Falha ao criar conta na corretora",
        details:
          typeof error === "object" && error && "response" in error
            ? (error as { response?: { data?: unknown } }).response?.data
            : error instanceof Error
              ? error.message
              : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
