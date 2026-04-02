import { PrismaClient, Level, Role } from "@prisma/client";
const prisma = new PrismaClient();

async function fix() {
  const result = await prisma.users.updateMany({
    where: { role: Role.STUDENT, level: null },
    data: { level: Level.SECONDARY_1 }
  });
  console.log(`Updated ${result.count} students with level SECONDARY_1`);
}

fix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
