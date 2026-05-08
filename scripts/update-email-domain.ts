import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.users.findMany({ select: { id: true, email: true } });

  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    if (user.email.endsWith("@surm.edu.sg")) {
      skipped++;
      continue;
    }

    const localPart = user.email.split("@")[0];
    const newEmail = `${localPart}@surm.edu.sg`;

    // Check if new email already taken
    const existing = await prisma.users.findUnique({ where: { email: newEmail } });
    if (existing && existing.id !== user.id) {
      console.log(`SKIP (conflict): ${user.email} -> ${newEmail} already taken by ${existing.id}`);
      skipped++;
      continue;
    }

    await prisma.users.update({ where: { id: user.id }, data: { email: newEmail } });
    console.log(`Updated: ${user.email} -> ${newEmail}`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
