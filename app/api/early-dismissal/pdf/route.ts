import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionType } from "@prisma/client";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { promises as fs } from "fs";
import path from "path";

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "surm-portal-uploads";

function isS3Configured() {
  return !!(
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_ACCESS_KEY_ID !== "" &&
    process.env.S3_SECRET_ACCESS_KEY !== "" &&
    process.env.S3_ACCESS_KEY_ID !== "your-access-key-id"
  );
}

const s3Client = isS3Configured()
  ? new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
      },
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { submissionId } = await request.json();
    if (!submissionId) {
      return NextResponse.json({ error: "submissionId is required" }, { status: 400 });
    }

    const submission = await prisma.submissions.findUnique({
      where: { id: submissionId },
      include: {
        users: { select: { id: true, name: true, email: true, level: true } },
      },
    });
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    if (submission.type !== SubmissionType.EARLY_DISMISSAL) {
      return NextResponse.json({ error: "Submission is not EARLY_DISMISSAL" }, { status: 400 });
    }

    if (user.role === "STUDENT" && submission.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const md = (submission.metadata || {}) as any;
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]); // A4 portrait
    const { width } = page.getSize();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold);

    const drawText = (text: string, x: number, y: number, size = 12, color = rgb(0, 0, 0)) => {
      page.drawText(text, { x, y, size, font, color });
    };

    const heading = "Early Dismissal Confirmation";
    const titleSize = 20;
    const titleWidth = titleFont.widthOfTextAtSize(heading, titleSize);
    page.drawText(heading, {
      x: (width - titleWidth) / 2,
      y: 790,
      size: titleSize,
      font: titleFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    drawText(`Generated: ${new Date().toLocaleString()}`, 40, 770, 10, rgb(0.4, 0.4, 0.4));

    let y = 730;
    const lineGap = 26;
    const fields: Array<[string, string]> = [
      ["Parent Full Name", md.parentName || ""],
      ["Student Full Name", md.fullName || ""],
      ["IC Number", md.icNumber || ""],
      ["Class", md.class || ""],
      ["Date & Time", md.dateTime || ""],
      ["Reason", md.reason || ""],
      ["Transport", md.transport || ""],
    ];
    for (const [label, value] of fields) {
      drawText(`${label}:`, 40, y, 12);
      drawText(value || "-", 160, y, 12);
      y -= lineGap;
    }

    if (md.signatureUrl && typeof md.signatureUrl === "string" && md.signatureUrl.length > 0) {
      try {
        const sigRes = await fetch(md.signatureUrl);
        const sigBuf = await sigRes.arrayBuffer();
        const sigImage = await pdf.embedPng(sigBuf);
        const sigDims = sigImage.scale(0.5);
        drawText("Signature:", 40, y, 12);
        page.drawImage(sigImage, {
          x: 160,
          y: y - sigDims.height + 8,
          width: sigDims.width,
          height: sigDims.height,
        });
        y -= sigDims.height + 20;
      } catch {
        drawText("Signature: [Failed to load image]", 40, y, 12, rgb(0.7, 0, 0));
        y -= lineGap;
      }
    }

    const pdfBytes = await pdf.save();
    const timestamp = Date.now();
    const fileName = `${submission.userId}/early-dismissal-${submission.id}-${timestamp}.pdf`;

    let pdfUrl = "";
    if (isS3Configured() && s3Client) {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileName,
          Body: Buffer.from(pdfBytes),
          ContentType: "application/pdf",
        })
      );
      const region = process.env.S3_REGION || "us-east-1";
      pdfUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${fileName}`;
    } else {
      const uploadsDir = path.join(process.cwd(), "uploads");
      const filePath = path.join(uploadsDir, fileName);
      const fileDir = path.dirname(filePath);
      await fs.mkdir(fileDir, { recursive: true });
      await fs.writeFile(filePath, Buffer.from(pdfBytes));
      pdfUrl = `/api/uploads/${fileName}`;
    }

    return NextResponse.json({ pdfUrl });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF confirmation", details: error.message },
      { status: 500 }
    );
  }
}
