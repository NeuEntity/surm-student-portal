import { PrismaClient, Role, Level, EmploymentType } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Adding demo accounts to database...");

  // Hash password for all users (password: "password123")
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Demo accounts to add
  const demoAccounts = [
    // Students
    {
      email: "student1@surm.edu",
      name: "Student One (Sec 1)",
      role: Role.STUDENT,
      level: Level.SECONDARY_1,
      icNumber: "S1234001A",
      phoneNumber: "+65 9001 0001",
      parentName: "Parent One",
      parentPhone: "+65 9001 0002",
      className: "Classroom 1",
    },
    {
      email: "student2@surm.edu",
      name: "Student Two (Sec 2)",
      role: Role.STUDENT,
      level: Level.SECONDARY_2,
      icNumber: "S1234002B",
      phoneNumber: "+65 9002 0001",
      parentName: "Parent Two",
      parentPhone: "+65 9002 0002",
      className: "Classroom 2",
    },
    {
      email: "student3@surm.edu",
      name: "Student Three (Sec 3)",
      role: Role.STUDENT,
      level: Level.SECONDARY_3,
      icNumber: "S1234003C",
      phoneNumber: "+65 9003 0001",
      parentName: "Parent Three",
      parentPhone: "+65 9003 0002",
      className: "Classroom 3 & 4",
    },
    {
      email: "student4@surm.edu",
      name: "Student Four (Sec 4)",
      role: Role.STUDENT,
      level: Level.SECONDARY_4,
      icNumber: "S1234004D",
      phoneNumber: "+65 9004 0001",
      parentName: "Parent Four",
      parentPhone: "+65 9004 0002",
      className: "Classroom Kaca",
    },
    
    // Teachers
    {
      email: "teacher@surm.edu",
      name: "Demo Teacher (Form & Tahfiz)",
      role: Role.TEACHER,
      level: null,
      teacherRoles: ["FORM", "TAHFIZ"],
      classesTaught: ["Classroom 1", "Halaqah Abdullah Ibn Mas'ood"],
      employmentType: EmploymentType.FULL_TIME,
    },
    {
      email: "teacher.form@surm.edu",
      name: "Demo Form Teacher",
      role: Role.TEACHER,
      level: null,
      teacherRoles: ["FORM"],
      classesTaught: ["Classroom 2"],
      employmentType: EmploymentType.FULL_TIME,
    },
    {
      email: "teacher.tahfiz@surm.edu",
      name: "Demo Tahfiz Teacher",
      role: Role.TEACHER,
      level: null,
      teacherRoles: ["TAHFIZ"],
      classesTaught: ["Halaqah Ubay Ibn Ka'ab"],
      employmentType: EmploymentType.FULL_TIME,
    },
    {
      email: "teacher.subject@surm.edu",
      name: "Demo Subject Teacher",
      role: Role.TEACHER,
      level: null,
      teacherRoles: ["SUBJECT"],
      classesTaught: ["Mathematics", "Science"],
      employmentType: EmploymentType.PART_TIME,
    },
    {
      email: "principal@surm.edu.sg",
      name: "Principal SURM",
      role: Role.TEACHER,
      level: null,
      teacherRoles: ["PRINCIPAL"],
      classesTaught: [],
      employmentType: EmploymentType.FULL_TIME,
    },

    // Admin
    {
      email: "admin@surm.edu.sg",
      name: "Administrator SURM",
      role: Role.ADMIN,
      level: null,
    },
  ];

  let created = 0;
  let updated = 0;

  for (const account of demoAccounts) {
    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { email: account.email },
    });

    try {
      if (existingUser) {
        // Update existing user
        console.log(`🔄 Updating existing user: ${account.email}`);
        
        const updateData: any = {
          password: hashedPassword, // Reset password
          name: account.name,
          role: account.role,
          updatedAt: new Date(),
        };

        if (account.level !== undefined) updateData.level = account.level;
        
        // Student fields
        if (account.role === Role.STUDENT) {
          if (account.icNumber) updateData.icNumber = account.icNumber;
          if (account.phoneNumber) updateData.phoneNumber = account.phoneNumber;
          if (account.parentName) updateData.parentName = account.parentName;
          if (account.parentPhone) updateData.parentPhone = account.parentPhone;
          if (account.className) updateData.className = account.className;
        }

        // Teacher fields
        if (account.role === Role.TEACHER) {
          if (account.teacherRoles) updateData.teacherRoles = account.teacherRoles;
          if (account.classesTaught) updateData.classesTaught = account.classesTaught;
          if (account.employmentType) updateData.employmentType = account.employmentType;
        }

        await prisma.users.update({
          where: { email: account.email },
          data: updateData,
        });
        updated++;
      } else {
        // Create new user
        const userData: any = {
          id: crypto.randomUUID(),
          email: account.email,
          password: hashedPassword,
          name: account.name,
          role: account.role,
          level: account.level,
          updatedAt: new Date(),
        };

        // Student fields
        if (account.role === Role.STUDENT) {
          if (account.icNumber) userData.icNumber = account.icNumber;
          if (account.phoneNumber) userData.phoneNumber = account.phoneNumber;
          if (account.parentName) userData.parentName = account.parentName;
          if (account.parentPhone) userData.parentPhone = account.parentPhone;
          if (account.className) userData.className = account.className;
        }

        // Teacher fields
        if (account.role === Role.TEACHER) {
          if (account.teacherRoles) userData.teacherRoles = account.teacherRoles;
          if (account.classesTaught) userData.classesTaught = account.classesTaught;
          if (account.employmentType) userData.employmentType = account.employmentType;
        }

        await prisma.users.create({
          data: userData,
        });

        console.log(`✅ Created user: ${account.name} (${account.email})`);
        created++;
      }
    } catch (error: any) {
      console.error(`❌ Error processing user ${account.email}:`, error.message);
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   ✅ Created: ${created} user(s)`);
  console.log(`   🔄 Updated: ${updated} user(s)`);
  console.log("\n🔑 Login Credentials:");
  console.log("   Password for all: password123");
  console.log("   Students:");
  console.log("     - student1@surm.edu (Sec 1)");
  console.log("     - student2@surm.edu (Sec 2)");
  console.log("     - student3@surm.edu (Sec 3)");
  console.log("     - student4@surm.edu (Sec 4)");
  console.log("   Teachers:");
  console.log("     - teacher@surm.edu (Form & Tahfiz)");
  console.log("     - teacher.form@surm.edu (Form Only)");
  console.log("     - teacher.tahfiz@surm.edu (Tahfiz Only)");
  console.log("     - teacher.subject@surm.edu (Subject Only)");
  console.log("     - principal@surm.edu.sg (Principal)");
  console.log("   Admin:");
  console.log("     - admin@surm.edu.sg");
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
