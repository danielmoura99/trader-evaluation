// check-db.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkDatabase() {
  console.log("=== Verificando clientes com platformStartDate ===\n");

  const clientsWithPlatform = await prisma.client.findMany({
    where: {
      platformStartDate: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      platformStartDate: true,
      startDate: true,
      traderStatus: true,
    },
    take: 5,
  });

  console.log(`Encontrados ${clientsWithPlatform.length} clientes com platformStartDate:\n`);

  clientsWithPlatform.forEach((client, index) => {
    console.log(`${index + 1}. ${client.name}`);
    console.log(`   Email: ${client.email}`);
    console.log(`   Platform Start: ${client.platformStartDate}`);
    console.log(`   Evaluation Start: ${client.startDate}`);
    console.log(`   Status: ${client.traderStatus}`);
    console.log("");
  });

  console.log("\n=== Verificando total de clientes ===\n");

  const totalClients = await prisma.client.count();
  const clientsWithPlatformCount = await prisma.client.count({
    where: { platformStartDate: { not: null } },
  });

  console.log(`Total de clientes: ${totalClients}`);
  console.log(`Clientes com platformStartDate: ${clientsWithPlatformCount}`);
  console.log(`Clientes sem platformStartDate: ${totalClients - clientsWithPlatformCount}`);

  await prisma.$disconnect();
}

checkDatabase().catch((error) => {
  console.error("Erro:", error);
  process.exit(1);
});
