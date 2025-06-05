// app/api/operations-analyst/client/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cpf = searchParams.get("cpf");

    if (!cpf) {
      return Response.json(
        {
          success: false,
          error: "CPF é obrigatório",
        },
        { status: 400 }
      );
    }

    // Buscar cliente primeiro nas tabelas principais
    let client = await prisma.client.findFirst({
      where: {
        cpf: cpf.replace(/\D/g, ""),
      },
      select: {
        id: true,
        name: true,
        cpf: true,
        plan: true,
        platform: true,
      },
    });

    // Se não encontrar na tabela principal, buscar em MGC clients
    if (!client) {
      const mgcClient = await prisma.mgcClient.findFirst({
        where: {
          cpf: cpf.replace(/\D/g, ""),
        },
        select: {
          id: true,
          name: true,
          cpf: true,
          plan: true,
          platform: true,
        },
      });

      if (mgcClient) {
        client = mgcClient;
      }
    }

    // Se não encontrar em nenhuma tabela, buscar em PaidAccount através da relação
    if (!client) {
      const paidAccount = await prisma.paidAccount.findFirst({
        where: {
          client: {
            cpf: cpf.replace(/\D/g, ""),
          },
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              cpf: true,
              plan: true,
              platform: true,
            },
          },
        },
      });

      if (paidAccount) {
        client = paidAccount.client;
      }
    }

    if (!client) {
      return Response.json(
        {
          success: false,
          error: "Cliente não encontrado",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        cpf: client.cpf,
        plan: client.plan,
        platform: client.platform,
      },
    });
  } catch (error) {
    console.error("[Operations Analyst] Erro ao buscar cliente:", error);
    return Response.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
