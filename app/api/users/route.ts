import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role, Level } from "@prisma/client";
import bcrypt from "bcryptjs";

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

    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        level: true,
        icNumber: true,
        phoneNumber: true,
        parentName: true,
        parentPhone: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            submissions: true,
            grades: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
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
    const { name, email, password, role, level, icNumber, phoneNumber, parentName, parentPhone } = body;

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
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user data
    const userData: any = {
      id: crypto.randomUUID(),
      name,
      email,
      password: hashedPassword,
      role: role as Role,
      level: role === "STUDENT" ? (level as Level) : null,
      updatedAt: new Date(),
    };

    // Add student-specific fields
    if (role === "STUDENT") {
      if (icNumber) userData.icNumber = icNumber;
      if (phoneNumber) userData.phoneNumber = phoneNumber;
      if (parentName) userData.parentName = parentName;
      if (parentPhone) userData.parentPhone = parentPhone;
    }

    // Create user
    const newUser = await prisma.users.create({
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        level: true,
        icNumber: true,
        phoneNumber: true,
        parentName: true,
        parentPhone: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

