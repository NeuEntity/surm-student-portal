import { handlers } from "@/auth";

// Force Node.js runtime (required for bcryptjs and Prisma)
export const runtime = 'nodejs';

export const { GET, POST } = handlers;

