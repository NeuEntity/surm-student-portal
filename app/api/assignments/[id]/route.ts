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
    const { title, description, level, subject, dueDate, completed, fileUrl, videoUrl } = body;

    // Check if assignment exists and belongs to this teacher
    const existingAssignment = await prisma.assignments.findUnique({
      where: { id },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Only allow editing if the assignment belongs to this teacher
    if (existingAssignment.createdBy !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - You can only edit your own assignments" },
        { status: 403 }
      );
    }

    const updateData: any = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (level !== undefined) updateData.level = level;
    if (subject !== undefined) updateData.subject = subject;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (completed !== undefined) updateData.completed = completed;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl || null;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl || null;

    const assignment = await prisma.assignments.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment" },
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
    
    // Check if assignment exists and belongs to this teacher
    const existingAssignment = await prisma.assignments.findUnique({
      where: { id },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Only allow deleting if the assignment belongs to this teacher
    if (existingAssignment.createdBy !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - You can only delete your own assignments" },
        { status: 403 }
      );
    }

    await prisma.assignments.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}

