import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateLeaveBalance } from "@/lib/leave-logic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user employment type
    const dbUsers = await prisma.$queryRaw<any[]>`SELECT "employmentType" FROM "users" WHERE "id" = ${user.id}`;
    const dbUser = dbUsers[0];

    const balance = await calculateLeaveBalance(user.id, dbUser.employmentType);
    return NextResponse.json(balance);
  } catch (error) {
    console.error("Error fetching balance:", error);
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 });
  }
}
