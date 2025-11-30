/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/client-portal/generate-platform-pix/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPlatformRenewalCharge } from "@/lib/services/btg-pix-service";

const API_KEY = process.env.API_KEY;

// Headers CORS para permitir acesso do client-portal
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handler para OPTIONS (preflight)
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    // Validar API Key
    const authHeader = req.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");

    if (!apiKey || apiKey !== API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { evaluationId, renewalType } = body;

    if (!evaluationId || !renewalType) {
      return NextResponse.json(
        { error: "evaluationId and renewalType are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Buscar dados baseado no tipo
    let clientData: {
      name: string;
      cpf: string;
      email: string;
      platform: string;
    } | null = null;

    if (renewalType === "evaluation") {
      // Buscar Client
      const client = await prisma.client.findUnique({
        where: { id: evaluationId },
        select: {
          name: true,
          cpf: true,
          email: true,
          platform: true,
          traderStatus: true,
          platformStartDate: true,
        },
      });

      if (!client) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404, headers: corsHeaders }
        );
      }

      // Validar se pode renovar
      if (
        !client.platformStartDate ||
        (client.traderStatus !== "Em Curso" && client.traderStatus !== "Ativo")
      ) {
        return NextResponse.json(
          { error: "Client not eligible for renewal" },
          { status: 400, headers: corsHeaders }
        );
      }

      // Verificar se está dentro do prazo (≤3 dias para vencer)
      const platformEndDate = new Date(client.platformStartDate);
      platformEndDate.setDate(platformEndDate.getDate() + 30);
      const daysLeft = Math.ceil(
        (platformEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysLeft > 3) {
        return NextResponse.json(
          {
            error: "Renewal only available 3 days before expiration",
            daysLeft,
          },
          { status: 400, headers: corsHeaders }
        );
      }

      clientData = {
        name: client.name,
        cpf: client.cpf,
        email: client.email,
        platform: client.platform,
      };
    } else if (renewalType === "paid_account") {
      // Buscar PaidAccount via Client
      const paidAccount = await prisma.paidAccount.findUnique({
        where: { id: evaluationId },
        include: {
          client: {
            select: {
              name: true,
              cpf: true,
              email: true,
            },
          },
        },
      });

      if (!paidAccount) {
        return NextResponse.json(
          { error: "Paid account not found" },
          { status: 404, headers: corsHeaders }
        );
      }

      // Validar se pode renovar
      if (!paidAccount.startDate || paidAccount.status !== "Ativo") {
        return NextResponse.json(
          { error: "Account not eligible for renewal" },
          { status: 400, headers: corsHeaders }
        );
      }

      // Verificar se está dentro do prazo (≤3 dias para vencer)
      const platformEndDate = new Date(paidAccount.startDate);
      platformEndDate.setDate(platformEndDate.getDate() + 30);
      const daysLeft = Math.ceil(
        (platformEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysLeft > 3) {
        return NextResponse.json(
          {
            error: "Renewal only available 3 days before expiration",
            daysLeft,
          },
          { status: 400, headers: corsHeaders }
        );
      }

      clientData = {
        name: paidAccount.client.name,
        cpf: paidAccount.client.cpf,
        email: paidAccount.client.email,
        platform: paidAccount.platform,
      };
    }

    if (!clientData) {
      return NextResponse.json(
        { error: "Invalid renewal type" },
        { status: 400 }
      );
    }

    // Gerar cobrança PIX via BTG
    const pixCharge = await createPlatformRenewalCharge({
      platform: clientData.platform,
      clientName: clientData.name,
      clientCpf: clientData.cpf,
      evaluationId,
    });

    // Determinar valor
    const amount = clientData.platform === "Profit One" ? 9850 : 22600;

    // Criar registro de renovação pendente
    const renewal = await prisma.platformRenewal.create({
      data: {
        clientId: renewalType === "evaluation" ? evaluationId : null,
        paidAccountId: renewalType === "paid_account" ? evaluationId : null,
        renewalType,
        paymentId: pixCharge.txId,
        renewalDate: new Date(),
        amount,
        platform: clientData.platform,
        status: "pending",
        pixCode: pixCharge.emv,
        pixExpiresAt: new Date(pixCharge.expiresAt),
      },
    });

    return NextResponse.json(
      {
        success: true,
        renewal: {
          id: renewal.id,
          txId: pixCharge.txId,
          pixCode: pixCharge.emv,
          pixQrCode: pixCharge.qrCode || null,
          amount,
          expiresAt: pixCharge.expiresAt,
          platform: clientData.platform,
        },
      },
      { headers: corsHeaders }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("[API] Error generating platform PIX:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message || "Unknown error",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
