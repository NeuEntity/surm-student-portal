import { Role, Level } from "@prisma/client";
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      level?: Level;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    level?: Level;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    level?: Level;
  }
}

