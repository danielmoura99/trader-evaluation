"use server";

import { Client } from "@/app/types";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getClients() {
  return await prisma.client.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createClient(data: Client) {
  await prisma.client.create({
    data,
  });
  revalidatePath("/clients");
}

export async function updateClient(id: string, data: Client) {
  await prisma.client.update({
    where: { id },
    data,
  });
  revalidatePath("/clients");
}

export async function deleteClient(id: string) {
  await prisma.client.delete({
    where: { id },
  });
  revalidatePath("/clients");
}
