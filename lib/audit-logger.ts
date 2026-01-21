import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/auth";

export enum AuditAction {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  EXPORT = "EXPORT",
}

export enum AuditSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
}

interface AuditLogParams {
  action: string;
  entityId: string;
  entityType: string;
  details?: any;
  actorId?: string; 
  actorName?: string;
  actorRole?: string;
  severity?: string; 
}

export async function logActivity(params: AuditLogParams) {
  try {
    let actorId = params.actorId;
    let actorRole = params.actorRole || "SYSTEM";
    let actorName = params.actorName || "System";

    if (!actorId) {
        const session = await auth();
        if (session?.user) {
            actorId = session.user.id;
            actorRole = (session.user as any).role || "SYSTEM";
            actorName = session.user.name || "System";
        } else {
            actorId = "system";
        }
    }

    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await prisma.audit_logs.create({
      data: {
        action: params.action,
        entityId: params.entityId,
        entityType: params.entityType,
        actorId: actorId!,
        actorName: actorName,
        actorRole: actorRole,
        ipAddress: ipAddress,
        userAgent: userAgent,
        details: params.details || {},
        status: params.severity || "INFO",
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
