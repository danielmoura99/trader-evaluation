import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const passwordValue = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || "Admin";

    if (!email || !passwordValue) {
      throw new Error("Defina ADMIN_EMAIL e ADMIN_PASSWORD antes de executar o seed");
    }

    const existingAdmin = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingAdmin) {
      console.log("Usuario admin ja existe!");
      return;
    }

    const password = await hash(passwordValue, 12);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role: "ADMIN",
      },
    });

    console.log("Admin criado com sucesso:");
    console.log(`Email: ${admin.email}`);
    console.log(`Nome: ${admin.name}`);
  } catch (error) {
    console.error("Erro ao criar admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
