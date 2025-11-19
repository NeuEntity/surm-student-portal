import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const typeFilter = searchParams.get("type") as SubmissionType | null;

    // Students can only view their own submissions
    if (user.role === "STUDENT") {
      if (userId && userId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      
      const submissions = await prisma.submissions.findMany({
        where: { userId: user.id },
        include: {
          assignments: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              level: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(submissions);
    }

    // Teachers and Admins can view submissions
    // If userId is provided, filter by that user
    // If typeFilter is provided, filter by submission type (for forms)
    const whereClause: any = {};
    
    if (userId) {
      whereClause.userId = userId;
    }
    
    if (typeFilter) {
      whereClause.type = typeFilter;
    } else if (user.role === "TEACHER") {
      // By default, teachers see form submissions (MEDICAL_CERT and EARLY_DISMISSAL)
      // unless a specific userId is provided (then show all their submissions)
      if (!userId) {
        whereClause.type = {
          in: [SubmissionType.MEDICAL_CERT, SubmissionType.EARLY_DISMISSAL],
        };
      }
    }

    const submissions = await prisma.submissions.findMany({
      where: whereClause,
      include: {
        assignments: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            level: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Unauthorized - Students only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, fileUrl, assignmentId, metadata } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // File is required for assignments and medical certificates, optional for early dismissal
    if (type !== SubmissionType.EARLY_DISMISSAL && !fileUrl) {
      return NextResponse.json(
        { error: "File is required for this submission type" },
        { status: 400 }
      );
    }

    // For early dismissal without file, use a placeholder
    const finalFileUrl = fileUrl || "no-file-uploaded";

    // Check upload limit for medical certificates and early dismissals (per year)
    if (
      type === SubmissionType.MEDICAL_CERT ||
      type === SubmissionType.EARLY_DISMISSAL
    ) {
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

      const existingCount = await prisma.submissions.count({
        where: {
          userId: user.id,
          type: {
            in: [SubmissionType.MEDICAL_CERT, SubmissionType.EARLY_DISMISSAL],
          },
          createdAt: {
            gte: startOfYear,
            lte: endOfYear,
          },
        },
      });

      if (existingCount >= 5) {
        return NextResponse.json(
          { error: `Maximum upload limit (5) reached for forms this year (${currentYear})` },
          { status: 400 }
        );
      }
    }

    const submission = await prisma.submissions.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        type,
        fileUrl: finalFileUrl,
        assignmentId: assignmentId || null,
        ...(metadata && { metadata }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    );
  }
}

