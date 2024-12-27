// trader-evaluation/app/api/registration/process/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { hash } from "bcryptjs";

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
    const payment = await prisma.payment.findUnique({
      where: {
        id: data.paymentId,
        status: "received",
      },
    });

    console.log("[Process Registration] Payment encontrado:", payment);

    if (!payment) {
      console.log(
        "[Process Registration] Pagamento não encontrado ou já processado"
      );
      return Response.json(
        {
          error: "Pagamento não encontrado ou já processado",
        },
        { status: 404 }
      );
    }

    // Verificar se é cliente existente
    const existingClient = await prisma.client.findFirst({
      where: {
        OR: [{ email: data.email }, { cpf: data.cpf }],
      },
    });

    console.log(
      "[Process Registration] Cliente existente:",
      existingClient ? "Sim" : "Não"
    );

    // Iniciar transação para garantir consistência
    const result = await prisma.$transaction(async (tx) => {
      let userId: string | undefined;

      // Se for novo cliente, criar conta no portal
      if (!existingClient) {
        console.log("[Process Registration] Criando novo usuário...");
        // Criar senha inicial (últimos 4 dígitos do CPF)
        const initialPassword = data.cpf.slice(-4);
        const hashedPassword = await hash(initialPassword, 10);

        // Criar usuário no portal
        const user = await tx.user.create({
          data: {
            name: data.email,
            email: data.email,
            password: hashedPassword,
            role: "USER",
          },
        });

        userId = user.id;
        console.log("[Process Registration] Novo usuário criado:", userId);
      }

      console.log("[Process Registration] Criando nova avaliação...");
      // Criar nova avaliação
      const evaluation = await tx.client.create({
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
        },
      });

      console.log("[Process Registration] Avaliação criada:", evaluation.id);

      // Atualizar status do pagamento
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "completed",
          updatedAt: new Date(),
        },
      });

      console.log("[Process Registration] Status do pagamento atualizado");

      return { evaluation, userId };
    });

    console.log("[Process Registration] Processo finalizado com sucesso:", {
      evaluationId: result.evaluation.id,
      isNewUser: !!result.userId,
    });

    return Response.json({
      message: "Registro processado com sucesso",
      evaluationId: result.evaluation.id,
      isNewUser: !!result.userId,
      initialPassword: result.userId ? data.cpf.slice(-4) : undefined,
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
