import { PrismaClient } from "@prisma/client";
import { validateUserCreation, CreateUserData } from "../lib/permissions";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Admin System Verification...");

  const testAdminId = "test-admin-" + crypto.randomUUID();
  const testTeacherId = "test-teacher-" + crypto.randomUUID();
  const testEmail = `teacher-${Date.now()}@test.com`;

  try {
    // Cleanup previous runs if any (by email)
    await prisma.$executeRaw`DELETE FROM users WHERE email = 'admin-test@test.com'`;

    // 1. Setup: Create a Test Admin
    console.log("\n1. Setting up Test Admin...");
    await prisma.$executeRaw`
      INSERT INTO users (id, name, email, password, role, "createdAt", "updatedAt")
      VALUES (${testAdminId}, 'Test Admin', 'admin-test@test.com', 'hashedpassword', 'ADMIN', NOW(), NOW())
    `;
    console.log("   Test Admin created.");

    // 2. Simulate: Admin Creates a Teacher
    console.log("\n2. Simulating: Admin creates a Teacher with Roles...");
    const teacherData: CreateUserData = {
      name: "Test Teacher",
      email: testEmail,
      password: "password123",
      role: "TEACHER",
      teacherRoles: ["TAHFIZ"],
      classesTaught: ["5A"]
    };

    // 2a. Validate Input
    const validation = validateUserCreation(teacherData);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.error}`);
    }
    console.log("   Validation passed.");

    // 2b. Insert Teacher (Raw Query to ensure array fields work)
    await prisma.$executeRaw`
      INSERT INTO users (
        id, name, email, password, role, 
        "teacherRoles", "classesTaught", 
        "createdAt", "updatedAt"
      ) VALUES (
        ${testTeacherId}, ${teacherData.name}, ${teacherData.email}, ${teacherData.password}, 'TEACHER',
        ${teacherData.teacherRoles}, ${teacherData.classesTaught},
        NOW(), NOW()
      )
    `;
    console.log("   Teacher inserted.");

    // 2c. Create Audit Log
    const auditId1 = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO audit_logs (
        id, action, "targetId", "targetType", "actorId", details, "createdAt"
      ) VALUES (
        ${auditId1}, 'CREATE_USER', ${testTeacherId}, 'USER', ${testAdminId}, 
        ${JSON.stringify({ name: teacherData.name, role: "TEACHER" })}::jsonb, NOW()
      )
    `;
    console.log("   Audit log created.");

    // 3. Verify Teacher Data
    console.log("\n3. Verifying Teacher Data...");
    const teachers = await prisma.$queryRaw<any[]>`
      SELECT * FROM users WHERE id = ${testTeacherId}
    `;
    const teacher = teachers[0];
    
    if (!teacher) throw new Error("Teacher not found in DB");
    
    console.log("   Teacher Found:", teacher.name);
    console.log("   Teacher Roles:", teacher.teacherRoles);
    console.log("   Classes Taught:", teacher.classesTaught);

    if (!teacher.teacherRoles.includes("TAHFIZ")) throw new Error("Missing TAHFIZ role");
    if (!teacher.classesTaught.includes("5A")) throw new Error("Missing 5A class");
    console.log("   Verification Successful.");

    // 4. Simulate: Admin Updates Teacher Permissions
    console.log("\n4. Simulating: Admin updates Teacher Permissions...");
    const newRoles = ["TAHFIZ", "FORM"];
    const newClasses = ["5A", "5B"];

    await prisma.$executeRaw`
      UPDATE users 
      SET "teacherRoles" = ${newRoles}, "classesTaught" = ${newClasses}, "updatedAt" = NOW()
      WHERE id = ${testTeacherId}
    `;
    console.log("   Teacher updated.");

    // 4b. Audit Log for Update
    const auditId2 = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO audit_logs (
        id, action, "targetId", "targetType", "actorId", details, "createdAt"
      ) VALUES (
        ${auditId2}, 'UPDATE_USER', ${testTeacherId}, 'USER', ${testAdminId}, 
        ${JSON.stringify({ changes: { teacherRoles: newRoles, classesTaught: newClasses } })}::jsonb, NOW()
      )
    `;

    // 5. Verify Update
    console.log("\n5. Verifying Update...");
    const updatedTeachers = await prisma.$queryRaw<any[]>`
      SELECT * FROM users WHERE id = ${testTeacherId}
    `;
    const updatedTeacher = updatedTeachers[0];

    console.log("   Updated Roles:", updatedTeacher.teacherRoles);
    console.log("   Updated Classes:", updatedTeacher.classesTaught);

    if (!updatedTeacher.teacherRoles.includes("FORM")) throw new Error("Missing FORM role");
    if (!updatedTeacher.classesTaught.includes("5B")) throw new Error("Missing 5B class");
    console.log("   Update Verification Successful.");

    // 6. Verify Audit Logs
    console.log("\n6. Verifying Audit Logs...");
    const logs = await prisma.$queryRaw<any[]>`
      SELECT * FROM audit_logs WHERE "targetId" = ${testTeacherId} ORDER BY "createdAt" ASC
    `;
    
    console.log(`   Found ${logs.length} audit logs.`);
    if (logs.length !== 2) throw new Error("Expected 2 audit logs");
    if (logs[0].action !== 'CREATE_USER') throw new Error("First log should be CREATE_USER");
    if (logs[1].action !== 'UPDATE_USER') throw new Error("Second log should be UPDATE_USER");
    console.log("   Audit Log Verification Successful.");

  } catch (error) {
    console.error("\n❌ Verification Failed:", error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log("\nCleaning up test data...");
    await prisma.$executeRaw`DELETE FROM audit_logs WHERE "targetId" = ${testTeacherId}`;
    await prisma.$executeRaw`DELETE FROM users WHERE id IN (${testAdminId}, ${testTeacherId})`;
    await prisma.$disconnect();
    console.log("Done.");
  }
}

main();
