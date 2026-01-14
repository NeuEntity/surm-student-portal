import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionStatus, SubmissionType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Principal
    const dbUsers = await prisma.$queryRaw<any[]>`SELECT "teacherRoles" FROM "users" WHERE "id" = ${user.id}`;
    const dbUser = dbUsers[0];
    const roles = dbUser?.teacherRoles || [];

    if (!roles.includes("PRINCIPAL")) {
      return NextResponse.json({ error: "Access denied. Principal role required." }, { status: 403 });
    }

    // Fetch pending leave requests
    const pendingLeaves = await prisma.submissions.findMany({
      where: {
        type: { in: [SubmissionType.ANNUAL_LEAVE, SubmissionType.MEDICAL_CERT] },
        status: SubmissionStatus.PENDING,
      },
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
      orderBy: { createdAt: "asc" }, // Oldest first
    });

    return NextResponse.json(pendingLeaves);
  } catch (error) {
    console.error("Error fetching approvals:", error);
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 });
  }
}
