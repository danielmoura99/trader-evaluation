// app/api/registration/process/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { TraderStatus, PaidAccountStatus } from "@/app/types";

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
  observation?: string;
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

    const data: RegistrationData = await req.json();
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

    // ✅ NOVA LÓGICA: Detectar tipos de plano
    const isMGTPlan = data.plan?.includes("MGT");
    const isDirectPlan = data.plan?.includes("DIRETO");

    console.log(`[Process Registration] Tipos de plano detectados:`, {
      isMGTPlan: isMGTPlan ? "Sim" : "Não",
      isDirectPlan: isDirectPlan ? "Sim" : "Não",
      planName: data.plan,
    });

    let clientId: string;
    let clientType: string;

    if (isMGTPlan) {
      // ✅ FLUXO EXISTENTE: Criar cliente MGC
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
          status: "Aguardando",
          startDate: new Date(data.startDate),
          observation: data.observation,
        },
      });

      clientId = mgcClient.id;
      clientType = "mgc";

      console.log(
        "[Process Registration] Cliente MGC criado com ID:",
        clientId
      );
    } else if (isDirectPlan) {
      // ✅ NOVO FLUXO: Planos DIRETO
      console.log("[Process Registration] Processando plano DIRETO...");

      // 1. Criar cliente normal com status "Direto"
      const client = await prisma.client.create({
        data: {
          name: data.name,
          email: data.email,
          cpf: data.cpf,
          phone: data.phone,
          birthDate: new Date(data.birthDate),
          address: data.address || "",
          zipCode: data.zipCode || "",
          platform: data.platform,
          plan: data.plan,
          traderStatus: TraderStatus.DIRECT, // ✅ Status "Direto"
          startDate: new Date(data.startDate),
          observation: data.observation || "Cliente direto - sem avaliação",
        },
      });

      clientId = client.id;
      clientType = "direct";

      console.log(
        "[Process Registration] Cliente DIRETO criado com ID:",
        clientId
      );

      // 2. ✅ AUTOMATICAMENTE criar entrada em paid_accounts
      const paidAccount = await prisma.paidAccount.create({
        data: {
          clientId: client.id,
          platform: data.platform,
          plan: data.plan,
          status: PaidAccountStatus.WAITING, // Aguardando liberação
        },
      });

      console.log(
        "[Process Registration] Conta remunerada criada automaticamente:",
        {
          paidAccountId: paidAccount.id,
          clientId: client.id,
          plan: data.plan,
          status: paidAccount.status,
        }
      );
    } else {
      // ✅ FLUXO EXISTENTE: Criar avaliação normal
      const evaluation = await prisma.client.create({
        data: {
          name: data.name,
          email: data.email,
          cpf: data.cpf,
          phone: data.phone,
          birthDate: new Date(data.birthDate),
          address: data.address || "",
          zipCode: data.zipCode || "",
          platform: data.platform,
          plan: data.plan,
          traderStatus: TraderStatus.WAITING, // Aguardando início da avaliação
          startDate: new Date(data.startDate),
          observation: data.observation,
        },
      });

      clientId = evaluation.id;
      clientType = "regular";

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

    // ✅ Log final do processamento
    console.log("[Process Registration] Processamento concluído:", {
      clientId,
      clientType,
      planType: isDirectPlan ? "DIRETO" : isMGTPlan ? "MGT" : "REGULAR",
      autoCreatedPaidAccount: isDirectPlan,
    });

    return Response.json({
      message: "Registro processado com sucesso",
      clientId: clientId,
      clientType: clientType,
      planType: isDirectPlan ? "direct" : isMGTPlan ? "mgc" : "regular",
      autoCreatedPaidAccount: isDirectPlan, // ✅ Indica se criou conta remunerada automaticamente
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
