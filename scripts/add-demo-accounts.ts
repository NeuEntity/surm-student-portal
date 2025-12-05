import { PrismaClient, Role, Level } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Menambahkan demo accounts ke database...");

  // Hash password untuk semua users (password: "password123")
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Demo accounts yang akan ditambahkan
  const demoAccounts = [
    {
      email: "student1@surm.edu",
      name: "Student One",
      role: Role.STUDENT,
      level: Level.SECONDARY_1,
      icNumber: "S1234001A",
      phoneNumber: "+65 9001 0001",
      parentName: "Parent One",
      parentPhone: "+65 9001 0002",
    },
    {
      email: "student2@surm.edu",
      name: "Student Two",
      role: Role.STUDENT,
      level: Level.SECONDARY_2,
      icNumber: "S1234002B",
      phoneNumber: "+65 9002 0001",
      parentName: "Parent Two",
      parentPhone: "+65 9002 0002",
    },
    {
      email: "teacher@surm.edu",
      name: "Teacher",
      role: Role.TEACHER,
      level: null,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const account of demoAccounts) {
    // Cek apakah user sudah ada
    const existingUser = await prisma.users.findUnique({
      where: { email: account.email },
    });

    if (existingUser) {
      console.log(`⏭️  User dengan email ${account.email} sudah ada, dilewati.`);
      skipped++;
      continue;
    }

    // Buat user baru
    try {
      const userData: any = {
        id: crypto.randomUUID(),
        email: account.email,
        password: hashedPassword,
        name: account.name,
        role: account.role,
        level: account.level,
        updatedAt: new Date(),
      };

      // Tambahkan field khusus student jika role adalah STUDENT
      if (account.role === Role.STUDENT) {
        if (account.icNumber) userData.icNumber = account.icNumber;
        if (account.phoneNumber) userData.phoneNumber = account.phoneNumber;
        if (account.parentName) userData.parentName = account.parentName;
        if (account.parentPhone) userData.parentPhone = account.parentPhone;
      }

      await prisma.users.create({
        data: userData,
      });

      console.log(`✅ Berhasil membuat user: ${account.name} (${account.email})`);
      created++;
    } catch (error: any) {
      console.error(`❌ Error membuat user ${account.email}:`, error.message);
    }
  }

  console.log("\n📊 Ringkasan:");
  console.log(`   ✅ Dibuat: ${created} user(s)`);
  console.log(`   ⏭️  Dilewati: ${skipped} user(s)`);
  console.log("\n🔑 Kredensial Login:");
  console.log("   Email: student1@surm.edu / password: password123");
  console.log("   Email: student2@surm.edu / password: password123");
  console.log("   Email: teacher@surm.edu / password: password123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

