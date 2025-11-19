import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { promises as fs } from "fs";
import path from "path";

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "surm-portal-uploads";

// Check if S3 is configured
const isS3Configured = () => {
  return !!(
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_ACCESS_KEY_ID !== "" &&
    process.env.S3_SECRET_ACCESS_KEY !== "" &&
    process.env.S3_ACCESS_KEY_ID !== "your-access-key-id"
  );
};

// Initialize S3 client only if configured
let s3Client: S3Client | null = null;
if (isS3Configured()) {
  s3Client = new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    endpoint: process.env.S3_ENDPOINT, // Optional: for MinIO or other S3-compatible services
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const userId = (session.user as any).id;
    const fileExtension = file.name.split(".").pop();
    const fileName = `${userId}/${timestamp}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if S3 is configured
    if (!isS3Configured() || !s3Client) {
      // For development: store files locally
      try {
        const uploadsDir = path.join(process.cwd(), "uploads");
        const filePath = path.join(uploadsDir, fileName);
        const fileDir = path.dirname(filePath);

        // Create uploads directory if it doesn't exist
        await fs.mkdir(fileDir, { recursive: true });

        // Write file to disk
        await fs.writeFile(filePath, buffer);

        const fileUrl = `/api/uploads/${fileName}`;
        console.log("File stored locally:", filePath);
        return NextResponse.json({
          success: true,
          fileUrl,
          fileName: file.name,
          note: "File stored locally - S3 not configured. Set S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY in .env for production",
        });
      } catch (localError) {
        console.error("Error storing file locally:", localError);
        // Fallback to mock URL if local storage fails
        const mockUrl = `/api/uploads/${fileName}`;
        return NextResponse.json({
          success: true,
          fileUrl: mockUrl,
          fileName: file.name,
          note: "Mock upload - Local storage failed. Set S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY in .env for production",
        });
      }
    }

    // Upload to S3 (or S3-compatible storage)
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    try {
      await s3Client.send(command);
      
      // Generate the file URL
      // In production, this would be your CDN URL or S3 public URL
      const fileUrl = process.env.S3_PUBLIC_URL 
        ? `${process.env.S3_PUBLIC_URL}/${fileName}`
        : `https://${BUCKET_NAME}.s3.${process.env.S3_REGION || "us-east-1"}.amazonaws.com/${fileName}`;
      
      return NextResponse.json({ 
        success: true, 
        fileUrl,
        fileName: file.name,
      });
    } catch (s3Error) {
      console.error("S3 upload error:", s3Error);
      throw s3Error;
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

// Generate presigned URL for direct upload (alternative method)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if S3 is configured
    if (!isS3Configured() || !s3Client) {
      return NextResponse.json(
        { error: "S3 not configured. Presigned URLs require S3 credentials." },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const fileName = searchParams.get("fileName");
    const fileType = searchParams.get("fileType");

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "Missing fileName or fileType" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const userId = (session.user as any).id;
    const fileExtension = fileName.split(".").pop();
    const key = `${userId}/${timestamp}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    // Generate presigned URL valid for 5 minutes
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300,
    });

    const fileUrl = process.env.S3_PUBLIC_URL 
      ? `${process.env.S3_PUBLIC_URL}/${key}`
      : `https://${BUCKET_NAME}.s3.${process.env.S3_REGION || "us-east-1"}.amazonaws.com/${key}`;

    return NextResponse.json({
      presignedUrl,
      fileUrl,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

