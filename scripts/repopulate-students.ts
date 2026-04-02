import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

const studentsData = [
  {
    email: "adeeba@surm.edu.sg",
    name: "Adeeba Akbar Shaikh",
  },
  {
    email: "ahmed@surm.edu.sg",
    name: "Ahmed bin Rami",
  },
  {
    email: "fatheen@surm.edu.sg",
    name: "Fatheen Solehah binte Mohd Fadil",
  },
  {
    email: "aseela@surm.edu.sg",
    name: "H Aseela",
  },
  {
    email: "hassan@surm.edu.sg",
    name: "Hassan Afeefuddin Khan",
  },
  {
    email: "ilman@surm.edu.sg",
    name: "Ilman Dzulfiqar bin Othman",
  },
  {
    email: "aafiyah@surm.edu.sg",
    name: "M. Aafiyah Al Zahra",
  },
  {
    email: "muadz@surm.edu.sg",
    name: "Mohamad Mu'adz Koenitz bin Mohamad Fahamy",
  },
  {
    email: "arash@surm.edu.sg",
    name: "Muhammad Arash bin Zahari",
  },
  {
    email: "mirza@surm.edu.sg",
    name: "Muhammad Nur Mirza bin Musa",
  },
  {
    email: "lathifah@surm.edu.sg",
    name: "Nor Lathifah Isra binti Ismail",
  },
  {
    email: "qaireen@surm.edu.sg",
    name: "Qaireen Aliya binte Muhamed Idros",
  },
  {
    email: "quraisyah@surm.edu.sg",
    name: "Quraisyah Husin",
  },
  {
    email: "safiyyah@surm.edu.sg",
    name: "Safiyyah bint Abdur Rahman",
  },
  {
    email: "surfina@surm.edu.sg",
    name: "Surfina binte Mohamed Subhan",
  },
  {
    email: "hazeeq@surm.edu.sg",
    name: "Syed Muhammad Hazeeq bin Syed Ashraff Ali",
  },
  {
    email: "umran@surm.edu.sg",
    name: "Umran bin Amran",
  }
];

async function main() {
  console.log("Starting repopulation of students...");

  // 1. Delete all existing students
  console.log("Deleting existing students...");
  const deleteResult = await prisma.users.deleteMany({
    where: {
      role: Role.STUDENT,
    },
  });
  console.log(`Deleted ${deleteResult.count} existing student(s).`);

  // 2. Hash default password
  console.log("Hashing default password...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 3. Prepare data
  const dataToInsert = studentsData.map((s) => ({
    id: crypto.randomUUID(),
    email: s.email,
    password: hashedPassword,
    name: s.name,
    role: Role.STUDENT,
    updatedAt: new Date(),
    createdAt: new Date(),
  }));

  // 4. Insert new students
  console.log(`Inserting ${dataToInsert.length} new students...`);
  const insertResult = await prisma.users.createMany({
    data: dataToInsert,
    skipDuplicates: true,
  });

  console.log(`Successfully inserted ${insertResult.count} new student(s).`);
  console.log("Done.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
