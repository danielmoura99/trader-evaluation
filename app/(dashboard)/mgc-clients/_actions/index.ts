"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedSession } from "@/lib/security";

export async function getMgcClients() {
  await requireAuthenticatedSession();

  const clients = await prisma.mgcClient.findMany();

  return clients.sort((a, b) => {
    if (a.status === "Ativo" && b.status !== "Ativo") return -1;
    if (a.status !== "Ativo" && b.status === "Ativo") return 1;

    if (a.status === "Ativo" && b.status === "Ativo") {
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;

      const aDate = new Date(a.startDate);
      const bDate = new Date(b.startDate);

      return aDate.getTime() - bDate.getTime();
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function activateMgcClient(id: string) {
  await requireAuthenticatedSession();

  const startDate = new Date();

  await prisma.mgcClient.update({
    where: { id },
    data: {
      status: "Ativo",
      startDate,
    },
  });
  revalidatePath("/mgc-clients");
}

export async function createMgcClient(data: {
  name: string;
  cpf: string;
  phone: string;
  email: string;
  birthDate: Date;
  address?: string;
  zipCode?: string;
  platform: string;
  plan: string;
  observation?: string;
}) {
  await requireAuthenticatedSession();

  await prisma.mgcClient.create({
    data: {
      ...data,
      status: "Aguardando",
    },
  });
  revalidatePath("/mgc-clients");
}

export async function cancelMgcClient(
  id: string,
  reason: "Cancelado" | "Reprovado"
) {
  await requireAuthenticatedSession();

  const client = await prisma.mgcClient.findUnique({
    where: { id },
  });

  if (!client) {
    throw new Error("Cliente MGC nao encontrado");
  }

  await prisma.mgcClient.update({
    where: { id },
    data: {
      status: "Cancelado",
      endDate: new Date(),
    },
  });

  if (reason === "Reprovado") {
    let clientId: string;

    const existingClient = await prisma.client.findFirst({
      where: { cpf: client.cpf },
    });

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const newClient = await prisma.client.create({
        data: {
          name: client.name,
          cpf: client.cpf,
          phone: client.phone,
          birthDate: client.birthDate,
          address: client.address || "",
          zipCode: client.zipCode || "",
          email: client.email,
          platform: client.platform,
          plan: client.plan,
          traderStatus: "Reprovado",
          startDate: client.startDate,
          endDate: client.endDate,
          cancellationDate: new Date(),
          observation: client.observation || "Cliente MGT reprovado",
        },
      });

      clientId = newClient.id;
    }

    await prisma.contact.create({
      data: {
        clientId,
        status: "Sem contato",
        date: new Date(),
        notes: "Sem Contato",
        createdAt: new Date(),
      },
    });
  }

  revalidatePath("/mgc-clients");
  if (reason === "Reprovado") {
    revalidatePath("/reproved");
  }
}

export async function updateMgcClient(
  id: string,
  data: {
    platform?: string;
    plan?: string;
    observation?: string;
    startDate?: Date | null;
    endDate?: Date | null;
    status?: string;
  }
) {
  await requireAuthenticatedSession();

  await prisma.mgcClient.update({
    where: { id },
    data,
  });
  revalidatePath("/mgc-clients");
}

export async function deleteMgcClient(id: string) {
  await requireAuthenticatedSession();

  await prisma.mgcClient.delete({
    where: { id },
  });
  revalidatePath("/mgc-clients");
}
