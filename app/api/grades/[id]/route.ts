import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const user = session?.user as any;

    if (!user || user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Unauthorized - Teachers only" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { score, maxScore, feedback } = body;

    const grade = await prisma.grades.update({
      where: { id },
      data: {
        score: parseFloat(score),
        maxScore: maxScore ? parseFloat(maxScore) : undefined,
        feedback,
        gradedBy: user.id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(grade);
  } catch (error) {
    console.error("Error updating grade:", error);
    return NextResponse.json(
      { error: "Failed to update grade" },
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

    if (!user || user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Unauthorized - Teachers only" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await prisma.grades.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting grade:", error);
    return NextResponse.json(
      { error: "Failed to delete grade" },
      { status: 500 }
    );
  }
}

