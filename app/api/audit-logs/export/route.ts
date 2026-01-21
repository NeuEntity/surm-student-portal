import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "csv";
  const search = searchParams.get("search");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const action = searchParams.get("action");
  const role = searchParams.get("role");

  const where: any = {};

  if (search) {
    where.OR = [
      { actorName: { contains: search, mode: "insensitive" } },
      { entityId: { contains: search, mode: "insensitive" } },
      { action: { contains: search, mode: "insensitive" } },
    ];
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  if (action && action !== "ALL") {
    where.action = action;
  }

  if (role && role !== "ALL") {
    where.actorRole = role;
  }

  try {
    const logs = await prisma.audit_logs.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const data = logs.map(log => ({
      Date: log.createdAt.toISOString(),
      Action: log.action,
      Actor: log.actorName || log.actorId,
      Role: log.actorRole,
      Entity: log.entityType,
      "Entity ID": log.entityId,
      IP: log.ipAddress || "-",
      Status: log.status,
      Details: log.details ? JSON.stringify(log.details) : ""
    }));

    if (format === "csv" || format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
      
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: format as any });
      
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": format === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.${format}"`,
        },
      });
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });

  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
