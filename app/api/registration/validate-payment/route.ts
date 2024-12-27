// trader-evaluation/app/api/registration/validate-payment/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    console.log("[Validate Payment] Iniciando validação...");

    // Verificar API Key
    const authHeader = req.headers.get("authorization");
    console.log("[Validate Payment] Auth Header:", authHeader);

    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[Validate Payment] API Key não fornecida");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = authHeader.replace("Bearer ", "");
    if (apiKey !== process.env.API_KEY) {
      console.log("[Validate Payment] API Key inválida");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obter hublaPaymentId da query
    const { searchParams } = new URL(req.url);
    const hublaPaymentId = searchParams.get("paymentId");
    console.log("[Validate Payment] PaymentId recebido:", hublaPaymentId);

    if (!hublaPaymentId) {
      return Response.json(
        {
          error: "PaymentId não fornecido",
        },
        { status: 400 }
      );
    }

    // Buscar pagamento
    const payment = await prisma.payment.findFirst({
      where: {
        hublaPaymentId: hublaPaymentId,
        status: "received",
      },
    });

    console.log("[Validate Payment] Payment encontrado:", payment);

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
