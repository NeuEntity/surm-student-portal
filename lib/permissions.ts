import { Role, Level } from "@prisma/client";

export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";
export type UserLevel = "SECONDARY_1" | "SECONDARY_2" | "SECONDARY_3" | "SECONDARY_4";

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  level?: UserLevel;
  icNumber?: string;
  phoneNumber?: string;
  parentName?: string;
  parentPhone?: string;
  className?: string;
  teacherRoles?: string[];
  classesTaught?: string[];
}

export function validateUserCreation(data: CreateUserData): { valid: boolean; error?: string } {
  const { name, email, password, role, level } = data;

  if (!name || !email || !password || !role) {
    return { valid: false, error: "Missing required fields" };
  }

  // Students must have a level
  if (role === "STUDENT" && !level) {
    return { valid: false, error: "Students must have a level assigned" };
  }

  // Teachers should ideally have roles if provided, but empty is allowed (just means no permissions yet)
  // However, we can enforce types if needed. For now, just ensuring arrays are arrays happens at runtime before this, 
  // but we can check here too if we want strict typing.
  
  return { valid: true };
}

export function canManageUsers(currentUserRole?: string): boolean {
  return currentUserRole === "ADMIN";
}

export function filterSensitiveData(user: any) {
  const { password, ...rest } = user;
  return rest;
}
