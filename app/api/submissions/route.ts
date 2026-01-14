import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionType } from "@prisma/client";
import { validateLeaveRequest } from "@/lib/leave-logic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch full user details to get permissions
    // Using raw query to bypass Prisma Client validation error if client is not regenerated
    const dbUsers = await prisma.$queryRaw<any[]>`
        SELECT id, role, "teacherRoles", "classesTaught"
        FROM "users" 
        WHERE "id" = ${user.id}
    `;
    const dbUser = dbUsers[0];

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const typeFilter = searchParams.get("type") as SubmissionType | null;
    const classFilter = searchParams.get("class");
    const searchQuery = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Students can only view their own submissions
    if (dbUser.role === "STUDENT") {
      if (userId && userId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      
      const submissions = await prisma.submissions.findMany({
        where: { userId: user.id },
        include: {
          assignments: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              level: true,
              className: true, // Include className
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(submissions);
    }

    // Teachers Logic
    if (dbUser.role === "TEACHER") {
        // Teacher viewing their own submissions (e.g., Leave Requests)
        if (userId === user.id) {
             const submissions = await prisma.submissions.findMany({
                where: { userId: user.id },
                include: {
                    users: { select: { name: true } }
                },
                orderBy: { createdAt: "desc" }
             });
             return NextResponse.json(submissions);
        }

        // Teacher viewing Student submissions (Tahfiz/Form)
        const teacherRoles = dbUser.teacherRoles || [];
        const isAuthorized = teacherRoles.includes("TAHFIZ") || teacherRoles.includes("FORM") || teacherRoles.includes("PRINCIPAL");

        if (!isAuthorized) {
             return NextResponse.json(
                 { error: "Access denied: Requires Tahfiz, Form Teacher, or Principal role" }, 
                 { status: 403 }
             );
        }

        const whereClause: any = {};

        // Principal sees all teacher submissions? Or handles differently?
        // Principal specific logic handled in specific approval routes or here?
        // Let's keep this route for Student Submissions mainly, unless filtered.
        // If Principal wants to see teacher leaves, we might need a separate call or filter.
        
        // 2. Class Filtering (For Student Submissions)
        const classesTaught = dbUser.classesTaught || [];
        
        // If specific class requested
        if (classFilter) {
            if (!classesTaught.includes(classFilter) && !teacherRoles.includes("PRINCIPAL")) {
                return NextResponse.json({ error: "Access denied for this class" }, { status: 403 });
            }
            whereClause.users = { className: classFilter };
        } else {
            // Show all taught classes
            if (classesTaught.length > 0) {
                whereClause.users = {
                    className: { in: classesTaught }
                };
            } else if (!teacherRoles.includes("PRINCIPAL")) {
                // If teacher has no classes assigned and not principal
                return NextResponse.json({ 
                    data: [], 
                    meta: { total: 0, page, limit, totalPages: 0 } 
                });
            }
        }

        // 3. Search Functionality
        if (searchQuery) {
            whereClause.users = {
                ...whereClause.users,
                name: { contains: searchQuery, mode: 'insensitive' }
            };
        }

        // 4. Type Filtering
        if (typeFilter) {
            whereClause.type = typeFilter;
        } else {
            // Default: MC, Early Dismissal, Letters (Student types)
            whereClause.type = { 
                in: [
                    SubmissionType.MEDICAL_CERT, 
                    SubmissionType.EARLY_DISMISSAL, 
                    // Use string literal or cast if enum is not updated yet
                    "LETTERS" as SubmissionType 
                ] 
            };
        }

        // 5. Pagination & Fetch
        const [submissions, total] = await prisma.$transaction([
            prisma.submissions.findMany({
                where: whereClause,
                include: {
                    assignments: true,
                    users: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            level: true,
                            className: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.submissions.count({ where: whereClause })
        ]);

        return NextResponse.json({
            data: submissions,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    }

    // Admin or others (fallback to original logic or restrict)
    // Original logic allowed admins to see everything.
    // We'll preserve basic Admin access (view all)
    if (dbUser.role === "ADMIN") {
        const whereClause: any = {};
        if (userId) whereClause.userId = userId;
        if (typeFilter) whereClause.type = typeFilter;
        
        const submissions = await prisma.submissions.findMany({
            where: whereClause,
            include: {
                assignments: true,
                users: {
                    select: { id: true, name: true, email: true, level: true, className: true },
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        });
        
         return NextResponse.json({
            data: submissions,
            // Simple meta for admin for now
             meta: { page, limit }
        });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, fileUrl, assignmentId, metadata } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // --- STUDENT LOGIC ---
    if (user.role === "STUDENT") {
        // File is required for assignments and medical certificates and letters
        // Optional for early dismissal
        if (type !== SubmissionType.EARLY_DISMISSAL && !fileUrl) {
        return NextResponse.json(
            { error: "File is required for this submission type" },
            { status: 400 }
        );
        }

        const finalFileUrl = fileUrl || "no-file-uploaded";

        // Check upload limit (5 per year)
        if (
        type === SubmissionType.MEDICAL_CERT ||
        type === SubmissionType.EARLY_DISMISSAL ||
        type === ("LETTERS" as SubmissionType)
        ) {
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

        const existingCount = await prisma.submissions.count({
            where: {
            userId: user.id,
            type: {
                in: [
                    SubmissionType.MEDICAL_CERT, 
                    SubmissionType.EARLY_DISMISSAL, 
                    "LETTERS" as SubmissionType
                ],
            },
            createdAt: {
                gte: startOfYear,
                lte: endOfYear,
            },
            },
        });

        if (existingCount >= 5) {
            return NextResponse.json(
            { error: `Maximum upload limit (5) reached for forms this year (${currentYear})` },
            { status: 400 }
            );
        }
        }

        const submission = await prisma.submissions.create({
        data: {
            id: crypto.randomUUID(),
            userId: user.id,
            type,
            fileUrl: finalFileUrl,
            assignmentId: assignmentId || null,
            ...(metadata && { metadata }),
            updatedAt: new Date(),
        },
        });

        return NextResponse.json(submission, { status: 201 });
    }

    // --- TEACHER LOGIC (Leave Submission) ---
    if (user.role === "TEACHER") {
        if (type === SubmissionType.ANNUAL_LEAVE || type === SubmissionType.MEDICAL_CERT) {
            // 1. Fetch user details for employment type
            const dbUsers = await prisma.$queryRaw<any[]>`SELECT "employmentType" FROM "users" WHERE "id" = ${user.id}`;
            const dbUser = dbUsers[0];
            
            // 2. Validate Entitlement
            const days = metadata?.days || 0;
            if (days <= 0) {
                return NextResponse.json({ error: "Invalid number of days" }, { status: 400 });
            }

            const validation = await validateLeaveRequest(user.id, dbUser.employmentType, type, days);
            if (!validation.valid) {
                return NextResponse.json({ error: validation.error }, { status: 400 });
            }

            // 3. Create Submission
            const submission = await prisma.submissions.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: user.id,
                    type,
                    fileUrl: fileUrl || "no-file-uploaded", // Optional for AL?
                    status: "PENDING", // Explicitly pending
                    metadata: metadata,
                    updatedAt: new Date(),
                },
            });

            // 4. Audit Log
            await prisma.$executeRaw`
                INSERT INTO audit_logs (
                    id, action, "targetId", "targetType", "actorId", details, "createdAt"
                ) VALUES (
                    ${crypto.randomUUID()}, 'APPLY_LEAVE', ${submission.id}, 'SUBMISSION', ${user.id}, 
                    ${JSON.stringify({ type, days, status: 'PENDING' })}::jsonb, NOW()
                )
            `;

            return NextResponse.json(submission, { status: 201 });
        }
    }

    return NextResponse.json(
        { error: "Unauthorized submission type or role" },
        { status: 403 }
    );

  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    );
  }
}
