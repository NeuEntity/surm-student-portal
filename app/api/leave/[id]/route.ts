import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionStatus } from "@prisma/client";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const session = await auth();
    const user = session?.user as any;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check Principal Role
    const dbUsers = await prisma.$queryRaw<any[]>`SELECT "teacherRoles" FROM "users" WHERE "id" = ${user.id}`;
    const roles = dbUsers[0]?.teacherRoles || [];

    if (!roles.includes("PRINCIPAL")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { status, comments } = body;

    if (![SubmissionStatus.APPROVED, SubmissionStatus.REJECTED].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update Submission
    // Need to handle comments. Schema doesn't have comments field in Submissions?
    // Let's store comments in metadata.
    
    // 1. Get existing metadata
    const submission = await prisma.submissions.findUnique({ where: { id } });
    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const newMetadata = {
        ...(submission.metadata as object),
        principalComments: comments,
        approvedBy: user.id,
        approvalDate: new Date().toISOString()
    };

    const updated = await prisma.submissions.update({
        where: { id },
        data: {
            status: status as SubmissionStatus,
            metadata: newMetadata,
            updatedAt: new Date()
        }
    });

    // Audit Log
    await prisma.$executeRaw`
        INSERT INTO audit_logs (
            id, action, "targetId", "targetType", "actorId", details, "createdAt"
        ) VALUES (
            ${crypto.randomUUID()}, 'APPROVE_REJECT_LEAVE', ${id}, 'SUBMISSION', ${user.id}, 
            ${JSON.stringify({ status, comments })}::jsonb, NOW()
        )
    `;

    return NextResponse.json(updated);

  } catch (error) {
    console.error("Error updating leave:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
