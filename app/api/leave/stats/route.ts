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

    const dbUsers = await prisma.$queryRaw<any[]>`SELECT "teacherRoles", "role" FROM "users" WHERE "id" = ${user.id}`;
    const dbUser = dbUsers[0];
    const roles = dbUser?.teacherRoles || [];
    const userRole = dbUser?.role;

    const isAdmin = userRole === Role.ADMIN;
    const isPrincipal = roles.includes("PRINCIPAL");

    if (!isAdmin && !isPrincipal) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Aggregate stats
    const totalLeaves = await prisma.submissions.count({
        where: { type: { in: [SubmissionType.ANNUAL_LEAVE, SubmissionType.MEDICAL_CERT] } }
    });

    const pendingLeaves = await prisma.submissions.count({
        where: { 
            type: { in: [SubmissionType.ANNUAL_LEAVE, SubmissionType.MEDICAL_CERT] },
            status: SubmissionStatus.PENDING
        }
    });

    const approvedLeaves = await prisma.submissions.count({
        where: { 
            type: { in: [SubmissionType.ANNUAL_LEAVE, SubmissionType.MEDICAL_CERT] },
            status: SubmissionStatus.APPROVED
        }
    });

    const mcCount = await prisma.submissions.count({
        where: { type: SubmissionType.MEDICAL_CERT }
    });

    // Recent trend (last 7 days) - Optional, maybe just return counts for now
    
    return NextResponse.json({
        total: totalLeaves,
        pending: pendingLeaves,
        approved: approvedLeaves,
        mc: mcCount
    });

  } catch (error) {
    console.error("Error fetching leave stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
