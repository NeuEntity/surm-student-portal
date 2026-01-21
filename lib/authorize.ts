import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { User } from "next-auth";
import { logActivity, AuditAction, AuditSeverity } from "@/lib/audit-logger";

type AuthorizeInput = {
  email: string;
  password: string;
};

export async function authorizeUser({ email, password }: AuthorizeInput): Promise<User | null> {
  try {
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      console.error("User not found for email:", email);
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.error("Invalid password for email:", email);
      
      // Log failed login attempt
      await logActivity({
        action: AuditAction.LOGIN,
        entityId: user.id,
        entityType: "USER",
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        severity: AuditSeverity.WARNING,
        details: { status: "FAILED", reason: "Invalid password" }
      });
      
      return null;
    }

    // return only what NextAuth needs in the session / token
    // Convert null to undefined for optional level field to match NextAuth User type
    const result: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ...(user.level !== null && { level: user.level }),
    };
    
    console.log("Authorized user:", result.id, result.email, result.role);
    
    // Log successful login
    await logActivity({
        action: AuditAction.LOGIN,
        entityId: user.id,
        entityType: "USER",
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        severity: AuditSeverity.INFO,
        details: { status: "SUCCESS" }
    });

    return result;
  } catch (error) {
    console.error("Error in authorizeUser:", error);
    return null;
  }
}

