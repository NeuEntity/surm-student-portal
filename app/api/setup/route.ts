import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * One-time setup route for Vercel deployment
 * 
 * This route seeds the database with demo users.
 * 
 * ⚠️ IMPORTANT: Run migrations first!
 * Before using this route, ensure migrations have been run:
 *   pnpm prisma migrate deploy
 * 
 * ⚠️ SECURITY: Delete this route after first use!
 * 
 * Usage:
 * 1. Run migrations: pnpm prisma migrate deploy (via Vercel CLI)
 * 2. Deploy to Vercel
 * 3. Visit: https://your-app.vercel.app/api/setup?token=YOUR_SECRET_TOKEN
 * 4. Delete this file after setup is complete
 */

export async function GET(request: Request) {
  try {
    // Basic security check - require a token
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const expectedToken = process.env.SETUP_TOKEN || "change-me-in-production";

    if (token !== expectedToken) {
      return NextResponse.json(
        { error: "Unauthorized. Provide ?token=YOUR_SECRET_TOKEN" },
        { status: 401 }
      );
    }

    const results: string[] = [];

    // Step 1: Verify database connection and tables exist
    try {
      await prisma.users.count();
    } catch (error: any) {
      if (error.message?.includes("does not exist") || error.message?.includes("relation")) {
        return NextResponse.json(
          {
            error: "Database tables not found",
            message: "Please run migrations first: pnpm prisma migrate deploy",
            hint: "Use Vercel CLI: vercel env pull .env.local && pnpm prisma migrate deploy",
          },
          { status: 500 }
        );
      }
      throw error;
    }

    // Step 2: Check if users already exist
    const existingUsers = await prisma.users.count();
    if (existingUsers > 0) {
      results.push(`⚠️  Database already has ${existingUsers} users. Skipping seed.`);
      return NextResponse.json({
        success: true,
        message: "Database already seeded",
        results,
      });
    }

    // Step 3: Seed users
    results.push("🌱 Seeding database with demo users...");

    const hashedPassword = await bcrypt.hash("password123", 10);
    const now = new Date();

    const users = [
      {
        id: "student1",
        email: "student1@surm.edu",
        password: hashedPassword,
        name: "Student One",
        role: "STUDENT" as const,
        level: "SECONDARY_1" as const,
        updatedAt: now,
      },
      {
        id: "student2",
        email: "student2@surm.edu",
        password: hashedPassword,
        name: "Student Two",
        role: "STUDENT" as const,
        level: "SECONDARY_2" as const,
        updatedAt: now,
      },
      {
        id: "student3",
        email: "student3@surm.edu",
        password: hashedPassword,
        name: "Student Three",
        role: "STUDENT" as const,
        level: "SECONDARY_3" as const,
        updatedAt: now,
      },
      {
        id: "student4",
        email: "student4@surm.edu",
        password: hashedPassword,
        name: "Student Four",
        role: "STUDENT" as const,
        level: "SECONDARY_4" as const,
        updatedAt: now,
      },
      {
        id: "teacher1",
        email: "teacher@surm.edu",
        password: hashedPassword,
        name: "Teacher",
        role: "TEACHER" as const,
        level: null,
        updatedAt: now,
      },
      {
        id: "admin1",
        email: "admin@surm.edu",
        password: hashedPassword,
        name: "Admin",
        role: "ADMIN" as const,
        level: null,
        updatedAt: now,
      },
    ];

    await prisma.users.createMany({
      data: users,
      skipDuplicates: true,
    });

    results.push(`✅ Created ${users.length} users`);
    results.push("");
    results.push("📝 Demo Credentials:");
    results.push("  Student: student1@surm.edu / password123");
    results.push("  Teacher: teacher@surm.edu / password123");
    results.push("  Admin: admin@surm.edu / password123");
    results.push("");
    results.push("⚠️  IMPORTANT: Delete this route file after setup!");

    return NextResponse.json({
      success: true,
      message: "Database setup complete",
      results,
    });
  } catch (error: any) {
    console.error("Setup error:", error);
    return NextResponse.json(
      {
        error: "Setup failed",
        message: error.message,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

