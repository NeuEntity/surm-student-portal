import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const assignmentId = searchParams.get("assignmentId");
    const studentId = searchParams.get("studentId");

    const where: any = {};
    if (assignmentId) where.assignmentId = assignmentId;
    if (studentId) where.studentId = studentId;

    // Students can only see their own grades
    if (user.role === "STUDENT") {
      where.studentId = user.id;
    }
    
    // Teachers can only see grades for their own assignments
    if (user.role === "TEACHER") {
      // If assignmentId is provided, verify it belongs to this teacher
      if (assignmentId) {
        const assignment = await prisma.assignments.findUnique({
          where: { id: assignmentId },
        });
        if (!assignment || assignment.createdBy !== user.id) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      } else {
        // Filter by assignments created by this teacher
        where.assignments = {
          createdBy: user.id,
        };
      }
    }

    const grades = await prisma.grades.findMany({
      where,
      select: {
        id: true,
        studentId: true,
        assignmentId: true,
        score: true,
        maxScore: true,
        feedback: true,
        gradedBy: true,
        createdAt: true,
        updatedAt: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            level: true,
          },
        },
        assignments: {
          select: {
            id: true,
            title: true,
            subject: true,
            level: true,
            createdBy: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(grades);
  } catch (error) {
    console.error("Error fetching grades:", error);
    return NextResponse.json(
      { error: "Failed to fetch grades" },
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
    const { studentId, assignmentId, score, maxScore, feedback } = body;

    if (!studentId || !assignmentId || score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify that the assignment belongs to this teacher
    const assignment = await prisma.assignments.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Only allow grading if the assignment belongs to this teacher
    if (assignment.createdBy !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - You can only grade your own assignments" },
        { status: 403 }
      );
    }

    // Check if grade already exists
    const existingGrade = await prisma.grades.findUnique({
      where: {
        studentId_assignmentId: {
          studentId,
          assignmentId,
        },
      },
    });

    let grade;
    if (existingGrade) {
      // Update existing grade
      grade = await prisma.grades.update({
        where: { id: existingGrade.id },
        data: {
          score: parseFloat(score),
          maxScore: maxScore ? parseFloat(maxScore) : 100,
          feedback,
          gradedBy: user.id,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new grade
      grade = await prisma.grades.create({
        data: {
          id: crypto.randomUUID(),
          studentId,
          assignmentId,
          score: parseFloat(score),
          maxScore: maxScore ? parseFloat(maxScore) : 100,
          feedback,
          gradedBy: user.id,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json(grade, { status: existingGrade ? 200 : 201 });
  } catch (error) {
    console.error("Error creating/updating grade:", error);
    return NextResponse.json(
      { error: "Failed to save grade" },
      { status: 500 }
    );
  }
}

