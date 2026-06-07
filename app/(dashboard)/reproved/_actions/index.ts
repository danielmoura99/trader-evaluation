"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedSession } from "@/lib/security";

export async function getReprovedClients() {
  await requireAuthenticatedSession();

  try {
    return await prisma.client.findMany({
      where: {
        traderStatus: "Reprovado",
      },
      include: {
        contacts: {
          orderBy: {
            date: "desc",
          },
        },
      },
      orderBy: {
        cancellationDate: "desc",
      },
    });
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    throw error;
  }
}

export async function addContact(
  clientId: string,
  data: {
    date: Date;
    notes: string;
    status: string;
  }
) {
  await requireAuthenticatedSession();

  try {
    const contact = await prisma.contact.create({
      data: {
        clientId,
        status: data.status,
        date: data.date,
        notes: data.notes,
      },
    });

    revalidatePath("/reproved");
    return contact;
  } catch (error) {
    console.error("Erro ao adicionar contato:", error);
    throw error;
  }
}

export async function getContactHistory(clientId: string) {
  await requireAuthenticatedSession();

  return prisma.contact.findMany({
    where: {
      clientId,
    },
    orderBy: {
      date: "desc",
    },
  });
}
