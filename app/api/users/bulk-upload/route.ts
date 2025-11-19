import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role, Level } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";

interface UserRow {
  name: string;
  email: string;
  password: string;
  role: string;
  level?: string;
  icNumber?: string;
  phoneNumber?: string;
  parentName?: string;
  parentPhone?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    
    if (!validTypes.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls") && !file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file." },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with first row as headers
    const data = XLSX.utils.sheet_to_json<UserRow>(worksheet, {
      defval: "", // Default value for empty cells
    });
    
    // Normalize headers (case-insensitive, trim whitespace)
    const normalizedData = data.map((row: any) => {
      const normalized: any = {};
      Object.keys(row).forEach((key) => {
        const normalizedKey = key.trim().toLowerCase();
        normalized[normalizedKey] = row[key];
      });
      return normalized;
    });

    if (normalizedData.length === 0) {
      return NextResponse.json(
        { error: "Excel file is empty or has no data rows" },
        { status: 400 }
      );
    }

    // Validate and process users
    const results = {
      success: [] as string[],
      errors: [] as string[],
      skipped: [] as string[],
    };

    for (let i = 0; i < normalizedData.length; i++) {
      const rawRow = normalizedData[i];
      const rowNumber = i + 2; // +2 because we start from row 2 (after header)
      
      // Map normalized keys to expected keys
      const row: UserRow = {
        name: rawRow.name || rawRow["name"],
        email: rawRow.email || rawRow["email"],
        password: rawRow.password || rawRow["password"],
        role: rawRow.role || rawRow["role"],
        level: rawRow.level || rawRow["level"] || "",
        icNumber: rawRow.icnumber || rawRow["ic number"] || rawRow["icNumber"] || "",
        phoneNumber: rawRow.phonenumber || rawRow["phone number"] || rawRow["student phone"] || rawRow["phoneNumber"] || "",
        parentName: rawRow.parentname || rawRow["parent name"] || rawRow["parentName"] || "",
        parentPhone: rawRow.parentphone || rawRow["parent phone"] || rawRow["parentPhone"] || "",
      };

      try {
        // Validate required fields
        if (!row.name || !row.email || !row.password || !row.role) {
          results.errors.push(
            `Row ${rowNumber}: Missing required fields (name, email, password, role)`
          );
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          results.errors.push(`Row ${rowNumber}: Invalid email format (${row.email})`);
          continue;
        }

        // Validate role
        const validRoles = ["STUDENT", "TEACHER", "ADMIN"];
        if (!validRoles.includes(row.role.toUpperCase())) {
          results.errors.push(
            `Row ${rowNumber}: Invalid role (${row.role}). Must be STUDENT, TEACHER, or ADMIN`
          );
          continue;
        }

        const role = row.role.toUpperCase() as Role;

        // Validate level for students
        let level: Level | null = null;
        if (role === "STUDENT") {
          if (!row.level || row.level.trim() === "") {
            results.errors.push(
              `Row ${rowNumber}: Level is required for students`
            );
            continue;
          }

          // Normalize level (handle spaces, case)
          const normalizedLevel = row.level.trim().toUpperCase().replace(/\s+/g, "_");
          const validLevels = [
            "SECONDARY_1",
            "SECONDARY_2",
            "SECONDARY_3",
            "SECONDARY_4",
          ];
          
          if (!validLevels.includes(normalizedLevel)) {
            results.errors.push(
              `Row ${rowNumber}: Invalid level (${row.level}). Must be SECONDARY_1, SECONDARY_2, SECONDARY_3, or SECONDARY_4`
            );
            continue;
          }
          
          level = normalizedLevel as Level;
        }

        // Check if user already exists
        const existingUser = await prisma.users.findUnique({
          where: { email: row.email },
        });

        if (existingUser) {
          results.skipped.push(
            `Row ${rowNumber}: User with email ${row.email} already exists`
          );
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(row.password, 10);

        // Prepare user data
        const userData: any = {
          id: crypto.randomUUID(),
          name: row.name.trim(),
          email: row.email.trim().toLowerCase(),
          password: hashedPassword,
          role,
          level,
          updatedAt: new Date(),
        };

        // Add student-specific fields
        if (role === "STUDENT") {
          if (row.icNumber && row.icNumber.trim()) userData.icNumber = row.icNumber.trim();
          if (row.phoneNumber && row.phoneNumber.trim()) userData.phoneNumber = row.phoneNumber.trim();
          if (row.parentName && row.parentName.trim()) userData.parentName = row.parentName.trim();
          if (row.parentPhone && row.parentPhone.trim()) userData.parentPhone = row.parentPhone.trim();
        }

        // Create user
        await prisma.users.create({
          data: userData,
        });

        results.success.push(
          `Row ${rowNumber}: Created user ${row.name} (${row.email})`
        );
      } catch (error: any) {
        results.errors.push(
          `Row ${rowNumber}: ${error.message || "Unknown error"}`
        );
      }
    }

    return NextResponse.json({
      message: "Bulk upload completed",
      summary: {
        total: normalizedData.length,
        success: results.success.length,
        errors: results.errors.length,
        skipped: results.skipped.length,
      },
      details: results,
    });
  } catch (error: any) {
    console.error("Error processing bulk upload:", error);
    return NextResponse.json(
      { error: `Failed to process file: ${error.message}` },
      { status: 500 }
    );
  }
}

