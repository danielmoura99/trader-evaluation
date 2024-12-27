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
    const data: RegistrationData = await req.json();

    // Validar o pagamento
    const payment = await prisma.payment.findUnique({
      where: {
        id: data.paymentId,
        status: "received",
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

    // Verificar se é cliente existente
    const existingClient = await prisma.client.findFirst({
      where: {
        OR: [{ email: data.email }, { cpf: data.cpf }],
      },
    });

    // Iniciar transação para garantir consistência
    const result = await prisma.$transaction(async (tx) => {
      let userId: string | undefined;

      // Se for novo cliente, criar conta no portal
      if (!existingClient) {
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
      }

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

      // Atualizar status do pagamento
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "completed",
          updatedAt: new Date(),
        },
      });

      return { evaluation, userId };
    });

    return Response.json({
      message: "Registro processado com sucesso",
      evaluationId: result.evaluation.id,
      isNewUser: !!result.userId,
      initialPassword: result.userId ? data.cpf.slice(-4) : undefined,
    });
  } catch (error) {
    console.error("[Process Registration] Erro:", error);
    return Response.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
