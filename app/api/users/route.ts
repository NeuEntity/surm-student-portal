import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role, Level } from "@prisma/client";
import bcrypt from "bcryptjs";
import { logActivity, AuditAction, AuditSeverity } from "@/lib/audit-logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 403 }
      );
    }

    // Use raw query to fetch users with new fields (teacherRoles, classesTaught, className, employmentType)
    // since Prisma Client might be stale
    const users = await prisma.$queryRaw<any[]>`
      SELECT 
        u.id, u.name, u.email, u.role, u."level", 
        u."icNumber", u."phoneNumber", u."parentName", u."parentPhone",
        u."createdAt", u."updatedAt",
        u."teacherRoles", u."classesTaught", u."className", u."employmentType",
        (SELECT COUNT(*)::int FROM submissions s WHERE s."userId" = u.id) as "submissions_count",
        (SELECT COUNT(*)::int FROM grades g WHERE g."studentId" = u.id) as "grades_count"
      FROM users u
      ORDER BY u."createdAt" DESC
    `;

    // Format the result to match the expected shape (counts are usually numbers or bigints)
    const formattedUsers = users.map(u => ({
      ...u,
      _count: {
        submissions: Number(u.submissions_count || 0),
        grades: Number(u.grades_count || 0)
      }
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      name, email, password, role, level, 
      icNumber, phoneNumber, parentName, parentPhone,
      teacherRoles, classesTaught, className, employmentType 
    } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Students must have a level
    if (role === "STUDENT" && !level) {
      return NextResponse.json(
        { error: "Students must have a level assigned" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUsers = await prisma.$queryRaw<any[]>`SELECT id FROM users WHERE email = ${email}`;
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();
    const now = new Date();

    // Prepare fields for raw insert
    const roleVal = role as Role;
    const levelVal = role === "STUDENT" ? (level as Level) : null;
    
    // Optional fields
    const icNum = (role === "STUDENT" && icNumber) ? icNumber : null;
    const phone = (role === "STUDENT" && phoneNumber) ? phoneNumber : null;
    const pName = (role === "STUDENT" && parentName) ? parentName : null;
    const pPhone = (role === "STUDENT" && parentPhone) ? parentPhone : null;
    const clsName = (role === "STUDENT" && className) ? className : null;
    
    // Teacher fields
    const tRoles = (role === "TEACHER" && Array.isArray(teacherRoles)) ? teacherRoles : [];
    const cTaught = (role === "TEACHER" && Array.isArray(classesTaught)) ? classesTaught : [];
    const empType = (role === "TEACHER" && employmentType) ? employmentType : null;

    // Use executeRaw for insert to handle new fields
    await prisma.$executeRaw`
      INSERT INTO users (
        id, name, email, password, role, level, 
        "icNumber", "phoneNumber", "parentName", "parentPhone",
        "teacherRoles", "classesTaught", "className", "employmentType",
        "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${name}, ${email}, ${hashedPassword}, ${roleVal}::"Role", ${levelVal}::"Level",
        ${icNum}, ${phone}, ${pName}, ${pPhone},
        ${tRoles}, ${cTaught}, ${clsName}, ${empType}::"EmploymentType",
        ${now}, ${now}
      )
    `;

    // Log action
    await logActivity({
        action: AuditAction.CREATE,
        entityId: id,
        entityType: "USER",
        details: { name, email, role },
        actorId: user.id,
        severity: AuditSeverity.INFO
    });

    // Return the created user object (approximate)
    const newUser = {
      id, name, email, role: roleVal, level: levelVal,
      icNumber: icNum, phoneNumber: phone, parentName: pName, parentPhone: pPhone,
      teacherRoles: tRoles, classesTaught: cTaught, className: clsName, employmentType: empType,
      createdAt: now, updatedAt: now
    };

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
