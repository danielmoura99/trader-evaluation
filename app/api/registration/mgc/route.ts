import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("[MGC Registration] Iniciando processamento...");

    // Verificar API Key
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[MGC Registration] API Key não fornecida");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = authHeader.replace("Bearer ", "");
    if (apiKey !== process.env.API_KEY) {
      console.log("[MGC Registration] API Key inválida");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Processar dados do cliente MGC
    const data = await req.json();
    console.log("[MGC Registration] Dados recebidos:", data);

    // Criar novo cliente MGC
    const client = await prisma.mgcClient.create({
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
        observation: data.observation,
      },
    });

    return Response.json({
      message: "Cliente MGC registrado com sucesso",
      clientId: client.id,
    });
  } catch (error) {
    console.error("[MGC Registration] Erro crítico:", error);
    return Response.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
