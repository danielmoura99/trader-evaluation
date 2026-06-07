"use server";

import { Client } from "@/app/types";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedSession } from "@/lib/security";

export async function getClients() {
  await requireAuthenticatedSession();

  return prisma.client.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      contacts: {
        orderBy: {
          date: "desc",
        },
      },
    },
  });
}

export async function createClient(data: Client) {
  await requireAuthenticatedSession();

  const { contacts, ...clientData } = data as Client & {
    contacts?: unknown;
  };
  void contacts;

  await prisma.client.create({
    data: clientData,
  });
  revalidatePath("/clients");
}

export async function updateClient(id: string, data: Client) {
  await requireAuthenticatedSession();

  const { contacts, ...clientData } = data as Client & {
    contacts?: unknown;
  };
  void contacts;

  await prisma.client.update({
    where: { id },
    data: clientData,
  });
  revalidatePath("/clients");
}

export async function deleteClient(id: string) {
  await requireAuthenticatedSession();

  await prisma.client.delete({
    where: { id },
  });
  revalidatePath("/clients");
}

export async function getClientByCPF(cpf: string) {
  await requireAuthenticatedSession();

  try {
    const client = await prisma.client.findFirst({
      where: {
        cpf: cpf.replace(/\D/g, ""),
      },
      include: {
        contacts: {
          orderBy: {
            date: "desc",
          },
        },
      },
    });
    return client;
  } catch (error) {
    console.error("Erro ao buscar cliente por CPF:", error);
    return null;
  }
}
