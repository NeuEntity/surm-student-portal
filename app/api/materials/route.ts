import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Level, Subject } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get("level") as Level | null;
    const subject = searchParams.get("subject") as Subject | null;

    const where: any = {};
    
    // Teachers can only see materials they created (excludes null createdBy)
    if (user.role === "TEACHER") {
      where.createdBy = user.id; // This automatically excludes null since null !== user.id
    }
    // Students and admins can see all materials (or you can add filtering for students based on level)
    
    if (level) where.level = level;
    if (subject) where.subject = subject;

    const materials = await prisma.learning_materials.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(materials);
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
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
    const { title, description, level, subject, videoUrl, fileUrl, attachments } = body;

    if (!title || !description || !level || !subject) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (attachments && !Array.isArray(attachments)) {
      return NextResponse.json(
        { error: "Attachments must be an array" },
        { status: 400 }
      );
    }

    const material = await prisma.learning_materials.create({
      data: {
        id: crypto.randomUUID(),
        title,
        description,
        level,
        subject,
        videoUrl: videoUrl || null,
        fileUrl: fileUrl || attachments?.[0]?.url || null,
        attachments: attachments || null,
        createdBy: user.id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error("Error creating material:", error);
    return NextResponse.json(
      { error: "Failed to create material" },
      { status: 500 }
    );
  }
}

