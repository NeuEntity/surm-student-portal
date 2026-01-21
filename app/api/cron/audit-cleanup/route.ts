import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export async function GET(req: NextRequest) {
  // Verify authorization (CRON_SECRET)
  // In Vercel Cron, the header is "Authorization: Bearer <CRON_SECRET>"
  // Ensure CRON_SECRET is set in environment variables
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const retentionDays = 90; // Configurable retention period
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  try {
    // 1. Find old logs
    const oldLogs = await prisma.audit_logs.findMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    if (oldLogs.length === 0) {
      return NextResponse.json({ message: "No logs to archive" });
    }

    // 2. Archive to S3 (if configured)
    if (process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      const s3 = new S3Client({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      });

      const key = `audit-logs/archive-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
      
      await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: JSON.stringify(oldLogs),
        ContentType: "application/json"
      }));
    }

    // 3. Delete from DB
    const { count } = await prisma.audit_logs.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    return NextResponse.json({ 
      message: "Rotation complete", 
      archived: oldLogs.length, 
      deleted: count 
    });

  } catch (error) {
    console.error("Rotation failed:", error);
    return NextResponse.json({ error: "Rotation failed" }, { status: 500 });
  }
}
