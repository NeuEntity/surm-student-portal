
import { PrismaClient, Role, Level, EmploymentType } from "@prisma/client";
import { z } from "zod";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

// --- Zod Schemas ---

const StudentListSchema = z.array(z.string());

const ClassListSchema = z.object({
  level: z.string(),
  classroom: z.string(),
  form_teacher: z.string(),
  total_students: z.number(),
  breakdown: z.string(),
  students: StudentListSchema,
});

const HalaqahListSchema = z.object({
  halaqah_name: z.string(),
  teacher: z.string(),
  students: StudentListSchema,
});

const MetadataSchema = z.object({
  total_students: z.number(),
  demographics: z.object({
    banin_boys: z.number(),
    banat_girls: z.number(),
  }),
  last_updated: z.string(),
  version: z.string(),
});

const DataSchema = z.object({
  institution: z.string(),
  academic_year: z.string(),
  metadata: MetadataSchema,
  class_lists: z.array(ClassListSchema),
  halaqah_lists: z.array(HalaqahListSchema),
});

type Data = z.infer<typeof DataSchema>;

// --- Helper Functions ---

function generateEmail(name: string, role: Role): string {
  let cleanName = name.toLowerCase();
  
  // Remove titles
  const titles = ["ustaz", "ustazah", "teacher", "cikgu", "mr", "mrs", "ms", "mdm"];
  for (const title of titles) {
    if (cleanName.startsWith(title + " ") || cleanName.startsWith(title + ".")) {
      cleanName = cleanName.substring(title.length + 1).trim();
    }
  }

  cleanName = cleanName.replace(/[^a-z0-9]/g, ".");
  // Remove multiple dots
  cleanName = cleanName.replace(/\.+/g, ".");
  // Remove leading/trailing dots
  cleanName = cleanName.replace(/^\.+|\.+$/g, "");

  const domain = "surm.edu.sg";
  if (role === Role.TEACHER) {
    return `ustaz.${cleanName}@${domain}`;
  }
  return `${cleanName}@student.${domain}`;
}

function mapLevel(levelStr: string): Level | null {
  const lower = levelStr.toLowerCase();
  if (lower.includes("secondary 1")) return Level.SECONDARY_1;
  if (lower.includes("secondary 2")) return Level.SECONDARY_2;
  if (lower.includes("secondary 3")) return Level.SECONDARY_3;
  if (lower.includes("secondary 4")) return Level.SECONDARY_4;
  return null;
}

// --- Main Migration Logic ---

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const dataPath = path.join(__dirname, "data.json");

  console.log(`Starting migration... Mode: ${isDryRun ? "DRY RUN" : "LIVE EXECUTION"}`);

  // 1. Load and Validate Data
  if (!fs.existsSync(dataPath)) {
    console.error(`Data file not found at ${dataPath}`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const parseResult = DataSchema.safeParse(rawData);

  if (!parseResult.success) {
    console.error("JSON Validation Failed:", parseResult.error.format());
    process.exit(1);
  }

  const data = parseResult.data;
  console.log("JSON structure validated successfully.");

  // 2. Prepare Data Structures
  const teachersToProcess = new Set<string>();
  const teacherDetails = new Map<string, { roles: Set<string>; classes: Set<string> }>();
  const studentsToProcess = new Map<string, { level: Level; classroom: string }>();

  // Collect Teachers and Roles/Classes
  data.class_lists.forEach((c) => {
    teachersToProcess.add(c.form_teacher);
    if (!teacherDetails.has(c.form_teacher)) {
      teacherDetails.set(c.form_teacher, { roles: new Set(), classes: new Set() });
    }
    teacherDetails.get(c.form_teacher)!.roles.add("FORM");
    teacherDetails.get(c.form_teacher)!.classes.add(c.classroom);
  });

  data.halaqah_lists.forEach((h) => {
    teachersToProcess.add(h.teacher);
    if (!teacherDetails.has(h.teacher)) {
      teacherDetails.set(h.teacher, { roles: new Set(), classes: new Set() });
    }
    teacherDetails.get(h.teacher)!.roles.add("TAHFIZ");
    teacherDetails.get(h.teacher)!.classes.add(h.halaqah_name);
  });

  // Collect Students
  for (const c of data.class_lists) {
    const level = mapLevel(c.level);
    if (!level) {
      console.warn(`Warning: Could not map level '${c.level}' for classroom '${c.classroom}'`);
      continue;
    }
    for (const s of c.students) {
      if (studentsToProcess.has(s)) {
        console.warn(`Warning: Student '${s}' appears in multiple classes. Using the last one.`);
      }
      studentsToProcess.set(s, { level, classroom: c.classroom });
    }
  }

  console.log(`Found ${teachersToProcess.size} unique teachers.`);
  console.log(`Found ${studentsToProcess.size} unique students.`);

  // 3. Pre-fetch existing users to avoid N+1 queries in transaction
  const allUsers = await prisma.users.findMany();
  const usersByName = new Map<string, any>();
  const usersByEmail = new Set<string>();

  for (const user of allUsers) {
    usersByName.set(user.name.toLowerCase(), user);
    usersByEmail.add(user.email.toLowerCase());
  }

  // Prepare operations
  const teacherCreates: any[] = [];
  const teacherUpdates: { id: string; data: any }[] = [];
  const studentCreates: any[] = [];
  const studentUpdates: { id: string; data: any }[] = [];

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Process Teachers
  for (const teacherName of teachersToProcess) {
    const existingTeacher = usersByName.get(teacherName.toLowerCase());
    const details = teacherDetails.get(teacherName) || { roles: new Set<string>(), classes: new Set<string>() };
    const teacherRoles = Array.from(details.roles);
    const classesTaught = Array.from(details.classes);

    if (existingTeacher && existingTeacher.role === Role.TEACHER) {
      console.log(`[UPDATE] Teacher: ${teacherName} -> Roles: [${teacherRoles.join(", ")}], Classes: [${classesTaught.join(", ")}], Employment: FULL_TIME`);
      teacherUpdates.push({
          id: existingTeacher.id,
          data: {
              teacherRoles,
              classesTaught,
              employmentType: EmploymentType.FULL_TIME,
              updatedAt: new Date(),
          }
      });
    } else {
      const email = generateEmail(teacherName, Role.TEACHER);
      if (usersByEmail.has(email)) {
        console.warn(`[SKIP] Cannot create teacher '${teacherName}', email '${email}' already taken.`);
        continue;
      }
      
      console.log(`[CREATE] Teacher: ${teacherName} (${email}) -> Roles: [${teacherRoles.join(", ")}], Classes: [${classesTaught.join(", ")}], Employment: FULL_TIME`);
      usersByEmail.add(email); // Reserve email
      teacherCreates.push({
          id: crypto.randomUUID(),
          email,
          password: hashedPassword,
          name: teacherName,
          role: Role.TEACHER,
          teacherRoles,
          classesTaught,
          employmentType: EmploymentType.FULL_TIME,
          updatedAt: new Date(),
      });
    }
  }

  // Process Students
  for (const [studentName, info] of studentsToProcess) {
    const existingStudent = usersByName.get(studentName.toLowerCase());

    if (existingStudent && existingStudent.role === Role.STUDENT) {
      console.log(`[UPDATE] Student: ${studentName} -> Level: ${info.level}, Class: ${info.classroom}`);
      studentUpdates.push({
        id: existingStudent.id,
        data: {
          level: info.level,
          className: info.classroom,
          updatedAt: new Date(),
        },
      });
    } else {
      const email = generateEmail(studentName, Role.STUDENT);
      if (usersByEmail.has(email)) {
        console.warn(`[SKIP] Cannot create student '${studentName}', email '${email}' already taken.`);
        continue;
      }

      console.log(`[CREATE] Student: ${studentName} (${email}) -> Level: ${info.level}, Class: ${info.classroom}`);
      usersByEmail.add(email); // Reserve email
      studentCreates.push({
          id: crypto.randomUUID(),
          email,
          password: hashedPassword,
          name: studentName,
          role: Role.STUDENT,
          level: info.level,
          className: info.classroom,
          updatedAt: new Date(),
      });
    }
  }

  // 4. Execute Transaction
  try {
    await prisma.$transaction(async (tx) => {
       const initialUserCount = await tx.users.count();
       console.log(`Initial user count: ${initialUserCount}`);

       if (!isDryRun) {
          for (const data of teacherCreates) {
             await tx.users.create({ data });
          }
          for (const update of teacherUpdates) {
             await tx.users.update({ where: { id: update.id }, data: update.data });
          }
          for (const data of studentCreates) {
             await tx.users.create({ data });
          }
          for (const update of studentUpdates) {
             await tx.users.update({ where: { id: update.id }, data: update.data });
          }
       }

       if (!isDryRun) {
        const finalUserCount = await tx.users.count();
        console.log(`Final user count: ${finalUserCount}`);
        console.log(`Net change: ${finalUserCount - initialUserCount}`);
      } else {
         console.log("Dry run completed. No changes committed.");
      }
      
      // Force rollback if dry run to be absolutely safe
      if (isDryRun) {
         throw new Error("DRY_RUN_ROLLBACK");
      }
    }, {
      timeout: 20000
    });
  } catch (error: any) {
    if (error.message === "DRY_RUN_ROLLBACK") {
      console.log("Transaction rolled back (Dry Run).");
    } else {
      console.error("Migration failed:", error);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();

