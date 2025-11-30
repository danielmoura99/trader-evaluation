/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/test/simulate-pix-payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * ENDPOINT DE TESTE - Simula o pagamento de um PIX
 *
 * Este endpoint simula o que aconteceria quando o BTG envia o webhook
 * de confirmação de pagamento. Use apenas em desenvolvimento!
 *
 * Como usar:
 * 1. Gere um PIX no client-portal
 * 2. Copie o txId do PIX gerado
 * 3. Chame este endpoint com o txId
 * 4. O sistema processará como se o pagamento tivesse sido confirmado
 */

const API_KEY = process.env.API_KEY;

export async function POST(req: NextRequest) {
  try {
    // Validar API Key
    const authHeader = req.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");

    if (!apiKey || apiKey !== API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { txId } = body;

    if (!txId) {
      return NextResponse.json({ error: "txId is required" }, { status: 400 });
    }

    console.log(`[TEST] Simulating payment for txId: ${txId}`);

    // Buscar a renovação pendente
    const renewal = await prisma.platformRenewal.findFirst({
      where: {
        paymentId: txId,
        status: "pending",
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            platformStartDate: true,
          },
        },
        paidAccount: {
          select: {
            id: true,
            startDate: true,
          },
        },
      },
    });

    if (!renewal) {
      return NextResponse.json(
        {
          error: "Renewal not found or already processed",
          txId,
        },
        { status: 404 }
      );
    }

    // Simular o payload do webhook do BTG
    const mockWebhookPayload = {
      event: "instant-collection.paid",
      data: {
        txid: txId,
        status: "CONCLUIDA",
        paidBy: {
          cpf: renewal.client?.email || "00000000000",
          name: renewal.client?.name || "Cliente Teste",
        },
        paidAt: new Date().toISOString(),
        amount: {
          original: (renewal.amount / 100).toFixed(2),
        },
      },
    };

    console.log(
      "[TEST] Mock webhook payload:",
      JSON.stringify(mockWebhookPayload, null, 2)
    );

    // Processar o pagamento (mesmo código do webhook)
    await prisma.$transaction(async (tx) => {
      // Atualizar status da renovação
      await tx.platformRenewal.update({
        where: { id: renewal.id },
        data: {
          status: "completed",
          updatedAt: new Date(),
        },
      });

      // Atualizar Client ou PaidAccount baseado no tipo
      if (renewal.renewalType === "evaluation" && renewal.clientId) {
        const newPlatformStartDate = new Date();

        await tx.client.update({
          where: { id: renewal.clientId },
          data: {
            platformStartDate: newPlatformStartDate,
            lastRenewalDate: new Date(),
          },
        });

        console.log(`[TEST] ✅ Client ${renewal.clientId} platform renewed`);
        console.log(
          `[TEST] New platformStartDate: ${newPlatformStartDate.toISOString()}`
        );
      } else if (
        renewal.renewalType === "paid_account" &&
        renewal.paidAccountId
      ) {
        const newStartDate = new Date();

        await tx.paidAccount.update({
          where: { id: renewal.paidAccountId },
          data: {
            startDate: newStartDate,
            lastRenewalDate: new Date(),
          },
        });

        console.log(
          `[TEST] ✅ PaidAccount ${renewal.paidAccountId} platform renewed`
        );
        console.log(`[TEST] New startDate: ${newStartDate.toISOString()}`);
      }
    });

    // Buscar dados atualizados
    const updatedRenewal = await prisma.platformRenewal.findUnique({
      where: { id: renewal.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            platformStartDate: true,
            lastRenewalDate: true,
          },
        },
        paidAccount: {
          select: {
            id: true,
            startDate: true,
            lastRenewalDate: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment simulated successfully",
      simulation: {
        txId,
        renewalId: renewal.id,
        renewalType: renewal.renewalType,
        previousStatus: "pending",
        newStatus: "completed",
        amount: renewal.amount,
        platform: renewal.platform,
      },
      updatedData: {
        client: updatedRenewal?.client,
        paidAccount: updatedRenewal?.paidAccount,
      },
      webhookPayload: mockWebhookPayload,
    });
  } catch (error: any) {
    console.error("[TEST] Error simulating payment:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// GET para listar renovações pendentes (útil para ver quais txIds podem ser testados)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");

    if (!apiKey || apiKey !== API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pendingRenewals = await prisma.platformRenewal.findMany({
      where: {
        status: "pending",
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
        paidAccount: {
          select: {
            id: true,
            platform: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json({
      pendingRenewals: pendingRenewals.map((r) => ({
        txId: r.paymentId,
        renewalId: r.id,
        type: r.renewalType,
        platform: r.platform,
        amount: r.amount,
        clientName: r.client?.name || "N/A",
        createdAt: r.createdAt,
        expiresAt: r.pixExpiresAt,
      })),
      count: pendingRenewals.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
