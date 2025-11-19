import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();
  const userRole = (session.user as any).role;
  
  if (!allowedRoles.includes(userRole)) {
    redirect("/dashboard");
  }
  
  return session;
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user as any;
}

