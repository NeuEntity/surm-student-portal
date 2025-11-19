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
    const { title, description, level, subject, videoUrl, fileUrl, attachments } = body;

    if (attachments !== undefined && attachments !== null && !Array.isArray(attachments)) {
      return NextResponse.json(
        { error: "Attachments must be an array" },
        { status: 400 }
      );
    }

    // Check if material exists and belongs to this teacher
    const existingMaterial = await prisma.learning_materials.findUnique({
      where: { id },
    });

    if (!existingMaterial) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Only allow editing if the material belongs to this teacher
    if (existingMaterial.createdBy !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - You can only edit your own materials" },
        { status: 403 }
      );
    }

    const updateData: any = {
      title,
      description,
      level,
      subject,
      videoUrl: videoUrl || null,
      fileUrl: fileUrl || null,
      updatedAt: new Date(),
    };

    if (attachments !== undefined) {
      updateData.attachments = attachments;
      if ((!fileUrl || fileUrl === "") && attachments?.length) {
        updateData.fileUrl = attachments[0]?.url || null;
      }
    }

    const material = await prisma.learning_materials.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(material);
  } catch (error) {
    console.error("Error updating material:", error);
    return NextResponse.json(
      { error: "Failed to update material" },
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
    
    // Check if material exists and belongs to this teacher
    const existingMaterial = await prisma.learning_materials.findUnique({
      where: { id },
    });

    if (!existingMaterial) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Only allow deleting if the material belongs to this teacher
    if (existingMaterial.createdBy !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - You can only delete your own materials" },
        { status: 403 }
      );
    }

    await prisma.learning_materials.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting material:", error);
    return NextResponse.json(
      { error: "Failed to delete material" },
      { status: 500 }
    );
  }
}

