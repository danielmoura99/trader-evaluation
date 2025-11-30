// app/api/client-portal/pagarme/renewal-status/route.ts
// API pública para consultar status de renovações via Pagarme

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const API_KEY = process.env.API_KEY;

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return Response.json({}, { headers: corsHeaders });
}

/**
 * GET /api/client-portal/pagarme/renewal-status?evaluationId=xxx&renewalType=evaluation
 *
 * Retorna status de renovações para um Client ou PaidAccount
 */
export async function GET(req: NextRequest) {
  try {
    // Validar API Key
    const authHeader = req.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");

    if (!apiKey || apiKey !== API_KEY) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const evaluationId = searchParams.get("evaluationId");
    const renewalType = searchParams.get("renewalType");

    if (!evaluationId || !renewalType) {
      return Response.json(
        { error: "evaluationId e renewalType são obrigatórios" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Buscar renovações
    const renewals = await prisma.platformRenewal.findMany({
      where:
        renewalType === "evaluation"
          ? { clientId: evaluationId }
          : { paidAccountId: evaluationId },
      orderBy: { createdAt: "desc" },
      take: 10, // Últimas 10 renovações
    });

    // Separar pendentes e completadas
    const pending = renewals.filter((r) => r.status === "pending");
    const completed = renewals.filter((r) => r.status === "completed");

    return Response.json(
      {
        success: true,
        renewals: {
          pending,
          completed,
          total: renewals.length,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[Pagarme Renewal Status] Erro:", error);
    return Response.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
