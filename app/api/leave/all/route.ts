import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionStatus, SubmissionType, Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Access Control: Only Admin and Principal can view all leaves
    // Teachers can only view their own (but this route is 'all', so maybe restrict to Admin/Principal?)
    // Or allow teachers to see their own if userId matches.
    
    const dbUsers = await prisma.$queryRaw<any[]>`SELECT "teacherRoles", "role" FROM "users" WHERE "id" = ${user.id}`;
    const dbUser = dbUsers[0];
    const roles = dbUser?.teacherRoles || [];
    const userRole = dbUser?.role;

    const isAdmin = userRole === Role.ADMIN;
    const isPrincipal = roles.includes("PRINCIPAL");

    const searchParams = request.nextUrl.searchParams;
    const teacherId = searchParams.get("teacherId");
    const status = searchParams.get("status") as SubmissionStatus | "ALL" | null;
    const type = searchParams.get("type") as SubmissionType | "ALL" | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    // Build query
    const where: any = {
      type: { in: [SubmissionType.ANNUAL_LEAVE, SubmissionType.MEDICAL_CERT] },
    };

    // Access Logic
    if (!isAdmin && !isPrincipal) {
        // Regular teacher can only see their own
        where.userId = user.id;
    } else if (teacherId && teacherId !== "all") {
        // Admin/Principal filtering by specific teacher
        where.userId = teacherId;
    }

    // Status Filter
    if (status && status !== "ALL") {
        where.status = status;
    }

    // Type Filter
    if (type && type !== "ALL") {
        where.type = type;
    }

    // Date Range Filter (using createdAt as proxy for application date)
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Search by Name (requires relation filter)
    if (search) {
        where.users = {
            name: {
                contains: search,
                mode: 'insensitive'
            }
        };
    }

    const submissions = await prisma.submissions.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            employmentType: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return NextResponse.json({ error: "Failed to fetch leaves" }, { status: 500 });
  }
}
