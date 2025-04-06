// trader-evaluation/app/api/registration/process/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface RegistrationData {
  paymentId: string;
  platform: string;
  plan: string;
  startDate: string;
  // Dados do cliente
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: string;
  address?: string;
  zipCode?: string;
  observation?: string; // Adicionar campo
}

export async function POST(req: NextRequest) {
  try {
    console.log("[Process Registration] Iniciando processamento...");

    // Verificar API Key
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[Process Registration] API Key não fornecida");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = authHeader.replace("Bearer ", "");
    if (apiKey !== process.env.API_KEY) {
      console.log("[Process Registration] API Key inválida");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    console.log("[Process Registration] Dados recebidos:", data);

    // Validar o pagamento
    const payment = await prisma.payment.findFirst({
      where: {
        hublaPaymentId: data.paymentId,
        status: "received",
      },
    });

    if (!payment) {
      console.log(
        "[Process Registration] Pagamento não encontrado ou já processado"
      );
      return Response.json(
        { error: "Pagamento não encontrado ou já processado" },
        { status: 404 }
      );
    }

    // Verificar se o plano é MGT
    const isMGTPlan = data.plan?.includes("MGT");
    console.log(
      `[Process Registration] É plano MGT? ${isMGTPlan ? "Sim" : "Não"}`
    );

    let clientId;

    if (isMGTPlan) {
      // Criar novo cliente MGC
      const mgcClient = await prisma.mgcClient.create({
        data: {
          name: data.name,
          email: data.email,
          cpf: data.cpf,
          phone: data.phone,
          birthDate: new Date(data.birthDate),
          address: data.address,
          zipCode: data.zipCode,
          platform: data.platform,
          plan: data.plan,
          status: "Aguardando", // Status para MGC clients
          startDate: new Date(data.startDate),
          observation: data.observation,
        },
      });
      clientId = mgcClient.id;
      console.log(
        "[Process Registration] Cliente MGC criado com ID:",
        clientId
      );
    } else {
      // Criar nova avaliação normal
      const evaluation = await prisma.client.create({
        data: {
          name: data.name,
          email: data.email,
          cpf: data.cpf,
          phone: data.phone,
          birthDate: new Date(data.birthDate),
          address: data.address,
          zipCode: data.zipCode,
          platform: data.platform,
          plan: data.plan,
          traderStatus: "Aguardando Inicio",
          startDate: new Date(data.startDate),
          observation: data.observation,
        },
      });
      clientId = evaluation.id;
      console.log(
        "[Process Registration] Cliente regular criado com ID:",
        clientId
      );
    }

    // Atualizar status do pagamento
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "completed",
        updatedAt: new Date(),
      },
    });

    return Response.json({
      message: "Registro processado com sucesso",
      clientId: clientId,
      clientType: isMGTPlan ? "mgc" : "regular",
    });
  } catch (error) {
    console.error("[Process Registration] Erro crítico:", error);
    return Response.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
