// trader-evaluation/app/api/registration/validate-payment/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Obter hublaPaymentId da query
    const { searchParams } = new URL(req.url);
    const hublaPaymentId = searchParams.get("paymentId");

    if (!hublaPaymentId) {
      return Response.json(
        {
          error: "ID do pagamento não fornecido",
        },
        { status: 400 }
      );
    }

    // Buscar pagamento
    const payment = await prisma.payment.findUnique({
      where: {
        hublaPaymentId: hublaPaymentId,
        status: "received", // Apenas pagamentos recebidos e não processados
      },
    });

    if (!payment) {
      return Response.json(
        {
          error: "Pagamento não encontrado ou já processado",
        },
        { status: 404 }
      );
    }

    return Response.json({
      valid: true,
      paymentData: {
        id: payment.id,
        platform: payment.platform,
        plan: payment.plan,
        customerEmail: payment.customerEmail,
        customerName: payment.customerName,
        customerDocument: payment.customerDocument,
      },
    });
  } catch (error) {
    console.error("[Validate Payment] Erro:", error);
    return Response.json(
      {
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
