import { PrismaClient, Role, Level, EmploymentType } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Helper to sanitize name for email
function generateEmail(name: string, role: string): string {
  const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  // Keep it simpler: firstname.lastname if possible, else sanitized string
  const parts = name.toLowerCase().split(" ");
  const first = parts[0].replace(/[^a-z0-9]/g, "");
  const last = parts[parts.length - 1].replace(/[^a-z0-9]/g, "");
  
  if (role === Role.TEACHER) {
    return `ustaz.${first}.${last}@surm.edu.sg`; 
  }
  return `${first}.${last}@student.surm.edu.sg`;
}

// Helper to determine Level enum from string
function getLevel(levelStr: string): Level {
  if (levelStr.includes("Secondary 1")) return Level.SECONDARY_1;
  if (levelStr.includes("Secondary 2")) return Level.SECONDARY_2;
  if (levelStr.includes("Secondary 3")) return Level.SECONDARY_3;
  if (levelStr.includes("Secondary 4")) return Level.SECONDARY_4;
  return Level.SECONDARY_1; // Default
}

async function main() {
  console.log("🚀 Starting migration from real-data.json...");

  // Read JSON file
  const jsonPath = path.join(__dirname, "real-data.json");
  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(rawData);

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Track created emails to avoid duplicates
  const createdEmails = new Set<string>();

  // 1. Process Class Lists (Students & Form Teachers)
  for (const cls of data.class_lists) {
    console.log(`Processing ${cls.level} - ${cls.classroom}...`);
    
    // Create/Update Form Teacher
    const teacherName = cls.form_teacher;
    let teacherEmail = generateEmail(teacherName, Role.TEACHER);
    
    // Ensure unique email
    let counter = 1;
    while (createdEmails.has(teacherEmail)) {
      teacherEmail = teacherEmail.replace(/@/, `${counter}@`);
      counter++;
    }
    createdEmails.add(teacherEmail);

    // Check if teacher exists (by name to avoid duplicate creation if run multiple times)
    let teacher = await prisma.users.findFirst({ where: { name: teacherName, role: Role.TEACHER } });
    
    if (!teacher) {
      teacher = await prisma.users.create({
        data: {
          id: crypto.randomUUID(),
          email: teacherEmail,
          password: hashedPassword,
          name: teacherName,
          role: Role.TEACHER,
          teacherRoles: ["FORM"],
          classesTaught: [cls.classroom],
          employmentType: EmploymentType.FULL_TIME,
          updatedAt: new Date(),
        }
      });
      console.log(`   ✅ Created Form Teacher: ${teacherName}`);
    } else {
        // Update existing teacher's classes if needed
        const currentClasses = teacher.classesTaught || [];
        if (!currentClasses.includes(cls.classroom)) {
            await prisma.users.update({
                where: { id: teacher.id },
                data: { classesTaught: { push: cls.classroom } }
            });
        }
        console.log(`   ℹ️  Teacher exists: ${teacherName}`);
    }

    // Process Students
    for (const studentName of cls.students) {
      let studentEmail = generateEmail(studentName, Role.STUDENT);
      
      // Ensure unique email
      let sCounter = 1;
      while (createdEmails.has(studentEmail)) {
        studentEmail = studentEmail.replace(/@/, `${sCounter}@`);
        sCounter++;
      }
      createdEmails.add(studentEmail);

      const existingStudent = await prisma.users.findFirst({ where: { name: studentName, role: Role.STUDENT } });
      
      if (!existingStudent) {
        await prisma.users.create({
          data: {
            id: crypto.randomUUID(),
            email: studentEmail,
            password: hashedPassword,
            name: studentName,
            role: Role.STUDENT,
            level: getLevel(cls.level),
            className: cls.classroom,
            // Fill required/sensible defaults for missing fields
            icNumber: `T${Math.floor(1000000 + Math.random() * 9000000)}X`, // Mock IC
            phoneNumber: "+65 8000 0000", // Mock Phone
            parentName: "Parent of " + studentName.split(" ")[0], // Mock Parent
            parentPhone: "+65 9000 0000", // Mock Parent Phone
            updatedAt: new Date(),
          }
        });
      } else {
         // Update class info if changed
         if (existingStudent.className !== cls.classroom) {
             await prisma.users.update({
                 where: { id: existingStudent.id },
                 data: { className: cls.classroom, level: getLevel(cls.level) }
             });
         }
      }
    }
    console.log(`   ✅ Processed ${cls.students.length} students.`);
  }

  // 2. Process Halaqah Lists (Tahfiz Teachers)
  console.log("\nProcessing Halaqah Lists...");
  for (const halaqah of data.halaqah_lists) {
      const teacherName = halaqah.teacher;
      let teacherEmail = generateEmail(teacherName, Role.TEACHER);
      
      // Check if teacher already exists (e.g., might be a Form Teacher too)
      let teacher = await prisma.users.findFirst({ where: { name: teacherName, role: Role.TEACHER } });

      if (!teacher) {
        // Create new Tahfiz Teacher
        if (createdEmails.has(teacherEmail)) {
             let counter = 1;
             while (createdEmails.has(teacherEmail)) {
                 teacherEmail = teacherEmail.replace(/@/, `${counter}@`);
                 counter++;
             }
        }
        createdEmails.add(teacherEmail);

        teacher = await prisma.users.create({
            data: {
                id: crypto.randomUUID(),
                email: teacherEmail,
                password: hashedPassword,
                name: teacherName,
                role: Role.TEACHER,
                teacherRoles: ["TAHFIZ"],
                classesTaught: [halaqah.halaqah_name],
                employmentType: EmploymentType.PART_TIME, // Assumption for Tahfiz only
                updatedAt: new Date(),
            }
        });
        console.log(`   ✅ Created Tahfiz Teacher: ${teacherName}`);
      } else {
          // Update existing teacher
          const roles = teacher.teacherRoles || [];
          if (!roles.includes("TAHFIZ")) {
              roles.push("TAHFIZ");
          }
          const classes = teacher.classesTaught || [];
          if (!classes.includes(halaqah.halaqah_name)) {
              classes.push(halaqah.halaqah_name);
          }
          
          await prisma.users.update({
              where: { id: teacher.id },
              data: { teacherRoles: roles, classesTaught: classes }
          });
          console.log(`   🔄 Updated Teacher roles: ${teacherName}`);
      }

      // We don't need to re-create students, but we could link them to Halaqah if we had a specific field. 
      // For now, the student-halaqah relationship is implied by the teacher's class list or can be added to student record if schema supports it.
      // Assuming 'className' is for academic class. We can append to it or use a separate field if it existed.
      // For this migration, we ensure the students exist (they should from class lists).
      
      for (const studentName of halaqah.students) {
          const student = await prisma.users.findFirst({ where: { name: studentName, role: Role.STUDENT } });
          if (!student) {
              console.warn(`   ⚠️  Warning: Student ${studentName} in Halaqah list not found in Class lists! Creating now...`);
              // Create if missing (e.g. data inconsistency)
              let studentEmail = generateEmail(studentName, Role.STUDENT);
               if (createdEmails.has(studentEmail)) {
                    let sCounter = 1;
                    while (createdEmails.has(studentEmail)) {
                        studentEmail = studentEmail.replace(/@/, `${sCounter}@`);
                        sCounter++;
                    }
               }
               createdEmails.add(studentEmail);
               
               await prisma.users.create({
                  data: {
                    id: crypto.randomUUID(),
                    email: studentEmail,
                    password: hashedPassword,
                    name: studentName,
                    role: Role.STUDENT,
                    level: Level.SECONDARY_1, // Default unknown
                    className: "Unknown Class",
                    icNumber: `T${Math.floor(1000000 + Math.random() * 9000000)}X`,
                    phoneNumber: "+65 8000 0000",
                    parentName: "Parent",
                    parentPhone: "+65 9000 0000",
                    updatedAt: new Date(),
                  }
               });
          }
      }
  }

  console.log("\n✅ Real data migration completed successfully!");
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
