import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role, Level } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const user = session?.user as any;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 403 }
      );
    }

    const { id } = await params;
    
    // Use queryRaw to fetch user with new fields
    const users = await prisma.$queryRaw<any[]>`
      SELECT 
        id, name, email, role, "level", 
        "icNumber", "phoneNumber", "parentName", "parentPhone",
        "createdAt", "updatedAt",
        "teacherRoles", "classesTaught", "className", "employmentType"
      FROM users 
      WHERE id = ${id}
    `;

    const targetUser = users[0];

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(targetUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const user = session?.user as any;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { 
      name, email, password, role, level, 
      icNumber, phoneNumber, parentName, parentPhone,
      teacherRoles, classesTaught, className, employmentType
    } = body;

    // Check if user exists
    const existingUsers = await prisma.$queryRaw<any[]>`SELECT * FROM users WHERE id = ${id}`;
    const existingUser = existingUsers[0];

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.$queryRaw<any[]>`SELECT id FROM users WHERE email = ${email}`;
      if (emailTaken.length > 0) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateName = name || existingUser.name;
    const updateEmail = email || existingUser.email;
    const updateRole = (role as Role) || existingUser.role;
    
    // Logic for role specific fields
    let updateLevel = existingUser.level;
    let updateIc = existingUser.icNumber;
    let updatePhone = existingUser.phoneNumber;
    let updatePName = existingUser.parentName;
    let updatePPhone = existingUser.parentPhone;
    let updateClassName = existingUser.className;
    let updateTRoles = existingUser.teacherRoles || [];
    let updateCTaught = existingUser.classesTaught || [];
    let updateEmpType = existingUser.employmentType;

    if (updateRole === "STUDENT") {
        updateLevel = level ? (level as Level) : existingUser.level;
        if (icNumber !== undefined) updateIc = icNumber;
        if (phoneNumber !== undefined) updatePhone = phoneNumber;
        if (parentName !== undefined) updatePName = parentName;
        if (parentPhone !== undefined) updatePPhone = parentPhone;
        if (className !== undefined) updateClassName = className;
        // Clear teacher fields
        updateTRoles = [];
        updateCTaught = [];
        updateEmpType = null;
    } else if (updateRole === "TEACHER") {
        updateLevel = null;
        updateIc = null;
        updatePhone = null;
        updatePName = null;
        updatePPhone = null;
        updateClassName = null;
        if (teacherRoles !== undefined) updateTRoles = teacherRoles;
        if (classesTaught !== undefined) updateCTaught = classesTaught;
        if (employmentType !== undefined) updateEmpType = employmentType;
    } else {
        // Admin or other
        updateLevel = null;
        updateIc = null;
        updatePhone = null;
        updatePName = null;
        updatePPhone = null;
        updateClassName = null;
        updateTRoles = [];
        updateCTaught = [];
        updateEmpType = null;
    }

    let hashedPassword = existingUser.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    const now = new Date();

    // Perform Update using executeRaw
    await prisma.$executeRaw`
        UPDATE users SET
            name = ${updateName},
            email = ${updateEmail},
            role = ${updateRole}::"Role",
            "level" = ${updateLevel}::"Level",
            "icNumber" = ${updateIc},
            "phoneNumber" = ${updatePhone},
            "parentName" = ${updatePName},
            "parentPhone" = ${updatePPhone},
            "teacherRoles" = ${updateTRoles},
            "classesTaught" = ${updateCTaught},
            "className" = ${updateClassName},
            "employmentType" = ${updateEmpType}::"EmploymentType",
            password = ${hashedPassword},
            "updatedAt" = ${now}
        WHERE id = ${id}
    `;

    // Log action to audit_logs
    await prisma.$executeRaw`
      INSERT INTO audit_logs (
        id, action, "targetId", "targetType", "actorId", details, "createdAt"
      ) VALUES (
        ${crypto.randomUUID()}, 'UPDATE_USER', ${id}, 'USER', ${user.id}, 
        ${JSON.stringify({ 
            changes: { 
                name: name ? 'changed' : 'unchanged',
                role: role ? 'changed' : 'unchanged',
                permissions: (teacherRoles || classesTaught) ? 'changed' : 'unchanged'
            } 
        })}::jsonb, 
        ${now}
      )
    `;

    // Fetch updated user to return
    const updatedUsers = await prisma.$queryRaw<any[]>`
        SELECT 
            id, name, email, role, "level", 
            "icNumber", "phoneNumber", "parentName", "parentPhone",
            "teacherRoles", "classesTaught", "className", "employmentType",
            "updatedAt"
        FROM users WHERE id = ${id}
    `;

    return NextResponse.json(updatedUsers[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const user = session?.user as any;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 403 }
      );
    }

    const { id } = await params;
    // Prevent admin from deleting themselves
    if (id === user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUsers = await prisma.$queryRaw<any[]>`SELECT id FROM users WHERE id = ${id}`;
    if (existingUsers.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete user
    await prisma.$executeRaw`DELETE FROM users WHERE id = ${id}`;
    
    // Log action
    await prisma.$executeRaw`
      INSERT INTO audit_logs (
        id, action, "targetId", "targetType", "actorId", details, "createdAt"
      ) VALUES (
        ${crypto.randomUUID()}, 'DELETE_USER', ${id}, 'USER', ${user.id}, 
        ${JSON.stringify({ deleted: true })}::jsonb, ${new Date()}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
