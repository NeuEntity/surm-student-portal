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

    // Check Admin Role
    // Also allow Principals if needed in future, but for now strict to ADMIN as per task
    // The requirement says "Enhance admin dashboard", so Admin access is key.
    // Principals use a different route /api/leave/[id] currently.
    // If we want to unify, we can. But let's stick to Admin for this route.
    if (user.role !== "ADMIN") {
         // Allow Principal also if they need to approve student letters?
         // User requirement didn't specify principal, but Admin.
         // Let's stick to Admin.
         return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { status, comments } = body;

    if (![SubmissionStatus.APPROVED, SubmissionStatus.REJECTED].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // 1. Get existing metadata
    const submission = await prisma.submissions.findUnique({ where: { id } });
    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const newMetadata = {
        ...(submission.metadata as object),
        adminComments: comments,
        processedBy: user.id,
        processedAt: new Date().toISOString()
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
            ${crypto.randomUUID()}, 'UPDATE_SUBMISSION_STATUS', ${id}, 'SUBMISSION', ${user.id}, 
            ${JSON.stringify({ status, comments })}::jsonb, NOW()
        )
    `;

    return NextResponse.json(updated);

  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
