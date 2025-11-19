import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Health check endpoint to verify database connection
 * Useful for debugging connection issues in production
 */
export async function GET() {
  try {
    // Check if DATABASE_URL is set
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        {
          status: "error",
          message: "DATABASE_URL environment variable is not set",
          details: "Please set DATABASE_URL in your Vercel environment variables",
        },
        { status: 500 }
      );
    }

    // Mask password in URL for security
    const maskedUrl = databaseUrl.replace(
      /:([^:@]+)@/,
      (match, password) => `:${"*".repeat(password.length)}@`
    );

    // Test database connection
    await prisma.$connect();
    const userCount = await prisma.users.count();
    await prisma.$disconnect();

    return NextResponse.json({
      status: "ok",
      database: {
        connected: true,
        url: maskedUrl,
        userCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const databaseUrl = process.env.DATABASE_URL;
    const maskedUrl = databaseUrl
      ? databaseUrl.replace(/:([^:@]+)@/, (match, password) => `:${"*".repeat(password.length)}@`)
      : "not set";

    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        error: error.message,
        database: {
          connected: false,
          url: maskedUrl,
        },
        troubleshooting: {
          steps: [
            "1. Verify DATABASE_URL is set in Vercel environment variables",
            "2. Check that your database server is running and accessible",
            "3. For Supabase: Use Connection Pooling with Session mode (port 6543)",
            "4. Ensure password is URL-encoded if it contains special characters",
            "5. Verify network/firewall settings allow connections",
          ],
          supabase: {
            connectionPooler: "Use: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true",
            directConnection: "Use: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public",
            note: "URL-encode special characters in password (! → %21, @ → %40, etc.)",
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

