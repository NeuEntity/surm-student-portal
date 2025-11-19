import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Level, Subject } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get("level") as Level | null;
    const subject = searchParams.get("subject") as Subject | null;

    const where: any = {};
    
    // Teachers can only see assignments they created (excludes null createdBy)
    if (user.role === "TEACHER") {
      where.createdBy = user.id; // This automatically excludes null since null !== user.id
    }
    // Students and admins can see all assignments (or you can add filtering for students based on level)
    
    if (level) where.level = level;
    if (subject) where.subject = subject;

    const assignments = await prisma.assignments.findMany({
      where,
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;

    if (!user || user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Unauthorized - Teachers only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, level, subject, dueDate } = body;

    if (!title || !description || !level || !subject || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignments.create({
      data: {
        id: crypto.randomUUID(),
        title,
        description,
        level,
        subject,
        dueDate: new Date(dueDate),
        createdBy: user.id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}

