// app/api/webhook/pagarme-platform-renewal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    console.log("\n=== [Pagarme Platform Renewal Webhook] Webhook recebido ===");

    const payload = await req.text();

    const webhookData = JSON.parse(payload);

    if (webhookData.type !== "order.paid") {
      console.log(
        "[Pagarme Platform Renewal Webhook] Evento ignorado:",
        webhookData.type
      );
      return NextResponse.json({ message: "Evento ignorado" });
    }

    const metadata = webhookData.data?.metadata;
    if (!metadata?.type && !metadata?.service) {
      return NextResponse.json({
        message: "Metadata de renovacao ausente - webhook ignorado",
        info: "Este webhook nao possui marcadores de renovacao de plataforma",
      });
    }

    if (
      metadata.type !== "platform_renewal" &&
      metadata.service !== "platform_renewal"
    ) {
      return NextResponse.json({
        message: "Nao e renovacao de plataforma - webhook ignorado",
        info: "Este webhook sera processado pelo endpoint de avaliacoes",
      });
    }

    const orderId = webhookData.data?.id;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID nao encontrado no webhook" },
        { status: 400 }
      );
    }

    const pendingRenewal = await prisma.platformRenewal.findFirst({
      where: {
        paymentId: orderId,
        status: "pending",
      },
      include: {
        client: {
          select: { name: true, email: true, platform: true },
        },
        paidAccount: {
          include: {
            client: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!pendingRenewal) {
      return NextResponse.json(
        { error: "Renovacao nao encontrada", orderId },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.platformRenewal.update({
        where: { id: pendingRenewal.id },
        data: {
          status: "paid",
          renewalDate: new Date(),
          updatedAt: new Date(),
        },
      });
    });

    const customerName =
      pendingRenewal.renewalType === "evaluation"
        ? pendingRenewal.client?.name
        : pendingRenewal.paidAccount?.client.name;

    const customerEmail =
      pendingRenewal.renewalType === "evaluation"
        ? pendingRenewal.client?.email
        : pendingRenewal.paidAccount?.client.email;

    return NextResponse.json({
      success: true,
      message: "Renovacao processada com sucesso",
      renewal: {
        id: pendingRenewal.id,
        renewalType: pendingRenewal.renewalType,
        platform: pendingRenewal.platform,
        amount: pendingRenewal.amount,
        orderId,
      },
      customer: {
        name: customerName,
        email: customerEmail,
      },
    });
  } catch (error) {
    console.error(
      "[Pagarme Platform Renewal Webhook] Erro critico:",
      error
    );

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "pagarme-platform-renewal",
    endpoint: "/api/webhook/pagarme-platform-renewal",
    events: ["order.paid"],
    description: "Webhook dedicado para renovacoes de plataforma via Pagarme",
  });
}
