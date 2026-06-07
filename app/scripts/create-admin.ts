import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const passwordValue = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  if (!email || !passwordValue) {
    throw new Error("Defina ADMIN_EMAIL e ADMIN_PASSWORD antes de criar o admin");
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

  console.log(`Admin criado com sucesso: ${admin.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
