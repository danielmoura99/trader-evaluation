/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/webhook/btg-pix/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook para receber notificações de pagamento PIX do BTG Pactual
 *
 * Eventos possíveis:
 * - instant-collection.paid: Quando uma cobrança PIX é paga
 * - instant-collection.unlinked: Quando um QR Code é desvinculado
 *
 * Documentação: https://developers.empresas.btgpactual.com/reference/instant-collection-webhook
 */

interface BTGWebhookPayload {
  event: string; // "instant-collection.paid" ou "instant-collection.unlinked"
  data: {
    txid: string;
    status?: string;
    paidBy?: {
      cpf?: string;
      cnpj?: string;
      name?: string;
    };
    paidAt?: string;
    amount?: {
      original: string;
    };
    location?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const payload: BTGWebhookPayload = await req.json();

    console.log("[BTG Webhook] Received event:", payload.event);
    console.log("[BTG Webhook] Data:", JSON.stringify(payload.data, null, 2));

    // Processar apenas eventos de pagamento confirmado
    if (payload.event === "instant-collection.paid") {
      const { txid, paidBy, paidAt } = payload.data;

      // Buscar a renovação pendente pelo txId
      const renewal = await prisma.platformRenewal.findFirst({
        where: {
          paymentId: txid,
          status: "pending",
        },
      });

      if (!renewal) {
        console.log(`[BTG Webhook] No pending renewal found for txId: ${txid}`);
        return NextResponse.json({
          success: false,
          message: "No pending renewal found",
        });
      }

      // Processar renovação em uma transação
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
          // Renovar plataforma do Client
          const newPlatformStartDate = new Date();

          await tx.client.update({
            where: { id: renewal.clientId },
            data: {
              platformStartDate: newPlatformStartDate,
              lastRenewalDate: new Date(),
            },
          });

          console.log(
            `[BTG Webhook] Client ${renewal.clientId} platform renewed`
          );
        } else if (
          renewal.renewalType === "paid_account" &&
          renewal.paidAccountId
        ) {
          // Renovar plataforma do PaidAccount
          const newStartDate = new Date();

          await tx.paidAccount.update({
            where: { id: renewal.paidAccountId },
            data: {
              startDate: newStartDate,
              lastRenewalDate: new Date(),
            },
          });

          console.log(
            `[BTG Webhook] PaidAccount ${renewal.paidAccountId} platform renewed`
          );
        }
      });

      console.log(
        `[BTG Webhook] Successfully processed payment for txId: ${txid}`
      );

      return NextResponse.json({
        success: true,
        message: "Payment processed successfully",
        txid,
      });
    }

    // Outros eventos são apenas logados
    console.log(
      `[BTG Webhook] Event ${payload.event} received but not processed`
    );

    return NextResponse.json({
      success: true,
      message: "Event received",
    });
  } catch (error: any) {
    console.error("[BTG Webhook] Error processing webhook:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificar se o webhook está ativo
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/webhook/btg-pix",
    events: ["instant-collection.paid", "instant-collection.unlinked"],
  });
}
