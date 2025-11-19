import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Level, Subject, SubmissionType } from "@prisma/client";
import { Plus } from "lucide-react";
import { revalidatePath } from "next/cache";
import { LogoutButton } from "@/components/logout-button";
import TeacherDashboardClient from "@/components/dashboard/teacher-dashboard-client";
import { CreateMaterialForm } from "@/components/dashboard/create-material-form";
import { CreateAssignmentForm } from "@/components/dashboard/create-assignment-form";

const SUBJECTS = [
  { value: Subject.AKIDAH, label: "Akidah" },
  { value: Subject.AKHLAK, label: "Akhlak" },
  { value: Subject.FIQH, label: "Fiqh" },
  { value: Subject.FARAIDH, label: "Faraidh" },
  { value: Subject.SIRAH, label: "Sirah" },
  { value: Subject.HADIS, label: "Hadis" },
  { value: Subject.MUSTOLAH_HADIS, label: "Mustolah Hadis" },
  { value: Subject.ENGLISH, label: "English" },
  { value: Subject.MALAY, label: "Malay" },
  { value: Subject.ARABIC, label: "Arabic" },
  { value: Subject.MATHS, label: "Maths" },
  { value: Subject.IRK, label: "IRK" },
];

const LEVELS = [
  { value: Level.SECONDARY_1, label: "Secondary 1" },
  { value: Level.SECONDARY_2, label: "Secondary 2" },
  { value: Level.SECONDARY_3, label: "Secondary 3" },
  { value: Level.SECONDARY_4, label: "Secondary 4" },
];

export default async function TeacherDashboardPage() {
  const session = await auth();
  const user = session?.user as any;

  if (!user || user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  async function createMaterial(formData: FormData) {
    "use server";

    try {
      const session = await auth();
      const currentUser = session?.user as any;
      
      if (!currentUser || currentUser.role !== "TEACHER") {
        throw new Error("Unauthorized");
      }

      // Verify the user exists in the database
      if (!currentUser.id) {
        console.error("No user ID in session. Session user:", currentUser);
        throw new Error("User ID not found in session. Please log out and log back in.");
      }

      console.log("Checking user existence for ID:", currentUser.id, "Email:", currentUser.email);

      const userExists = await prisma.users.findUnique({
        where: { id: currentUser.id },
      });

      if (!userExists) {
        console.error("User not found in database. Looking for ID:", currentUser.id);
        // Try to find by email as fallback
        if (currentUser.email) {
          const userByEmail = await prisma.users.findUnique({
            where: { email: currentUser.email },
          });
          if (userByEmail) {
            console.error("User found by email but ID mismatch. Session ID:", currentUser.id, "DB ID:", userByEmail.id);
          }
        }
        throw new Error("User not found in database. Please log out and log back in.");
      }

      console.log("User verified:", userExists.id, userExists.email);

      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const level = formData.get("level") as Level;
      const subject = formData.get("subject") as Subject;
      const videoUrl = (formData.get("videoUrl") as string) || "";
      const fileUrl = (formData.get("fileUrl") as string) || "";
      const attachmentsRaw = formData.get("attachments") as string | null;

      let attachments: any = null;
      if (attachmentsRaw) {
        try {
          attachments = JSON.parse(attachmentsRaw);
        } catch (error) {
          console.error("Failed to parse attachments payload", error);
        }
      }

      if (!title || !description || !level || !subject) {
        throw new Error("Missing required fields");
      }

      await prisma.learning_materials.create({
        data: {
          id: crypto.randomUUID(),
          title,
          description,
          level,
          subject,
          videoUrl: videoUrl || null,
          fileUrl: fileUrl || attachments?.[0]?.url || null,
          attachments: attachments || null,
          createdBy: currentUser.id,
          updatedAt: new Date(),
        },
      });

      revalidatePath("/dashboard/teacher");
    } catch (error) {
      console.error("Error creating material:", error);
      throw error;
    }
  }

  async function createAssignment(formData: FormData) {
    "use server";

    try {
      const session = await auth();
      const currentUser = session?.user as any;
      
      if (!currentUser || currentUser.role !== "TEACHER") {
        throw new Error("Unauthorized");
      }

      // Verify the user exists in the database
      if (!currentUser.id) {
        console.error("No user ID in session. Session user:", currentUser);
        throw new Error("User ID not found in session. Please log out and log back in.");
      }

      console.log("Checking user existence for ID:", currentUser.id, "Email:", currentUser.email);

      const userExists = await prisma.users.findUnique({
        where: { id: currentUser.id },
      });

      if (!userExists) {
        console.error("User not found in database. Looking for ID:", currentUser.id);
        // Try to find by email as fallback
        if (currentUser.email) {
          const userByEmail = await prisma.users.findUnique({
            where: { email: currentUser.email },
          });
          if (userByEmail) {
            console.error("User found by email but ID mismatch. Session ID:", currentUser.id, "DB ID:", userByEmail.id);
          }
        }
        throw new Error("User not found in database. Please log out and log back in.");
      }

      console.log("User verified:", userExists.id, userExists.email);

      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const level = formData.get("level") as Level;
      const subject = formData.get("subject") as Subject;
      const dueDate = formData.get("dueDate") as string;

      if (!title || !description || !level || !subject || !dueDate) {
        throw new Error("Missing required fields");
      }

      await prisma.assignments.create({
        data: {
          id: crypto.randomUUID(),
          title,
          description,
          level,
          subject,
          dueDate: new Date(dueDate),
          createdBy: currentUser.id,
          updatedAt: new Date(),
        },
      });

      revalidatePath("/dashboard/teacher");
    } catch (error) {
      console.error("Error creating assignment:", error);
      throw error;
    }
  }

  // Get only materials created by this teacher (excludes null createdBy)
  // Note: Using select to explicitly choose fields to avoid Prisma schema cache issues
  const materials = await prisma.learning_materials.findMany({
    where: { 
      createdBy: user.id, // This automatically excludes null since null !== user.id
    },
    select: {
      id: true,
      title: true,
      description: true,
      level: true,
      subject: true,
      videoUrl: true,
      fileUrl: true,
      attachments: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Get only assignments created by this teacher (excludes null createdBy)
  const assignments = await prisma.assignments.findMany({
    where: { 
      createdBy: user.id, // This automatically excludes null since null !== user.id
    },
    orderBy: { createdAt: "desc" },
  });

  const students = await prisma.users.findMany({
    where: { role: "STUDENT" },
    select: {
      id: true,
      name: true,
      email: true,
      level: true,
    },
  });

  // Get grades for assignments created by this teacher only (excludes null createdBy)
  const grades = await prisma.grades.findMany({
    where: {
      assignments: {
        createdBy: user.id, // This automatically excludes null since null !== user.id
      },
    },
    select: {
      id: true,
      studentId: true,
      assignmentId: true,
      score: true,
      maxScore: true,
      feedback: true,
      createdAt: true,
      users: {
        select: {
          name: true,
          email: true,
        },
      },
      assignments: {
        select: {
          title: true,
          subject: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get form submissions (MEDICAL_CERT and EARLY_DISMISSAL) for teachers to view
  const formSubmissions = await prisma.submissions.findMany({
    where: {
      type: {
        in: [SubmissionType.MEDICAL_CERT, SubmissionType.EARLY_DISMISSAL],
      },
    },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          level: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get assignment submissions for assignments created by this teacher
  const assignmentSubmissions = await prisma.submissions.findMany({
    where: {
      type: SubmissionType.ASSIGNMENT,
      assignments: {
        createdBy: user.id,
      },
    },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          level: true,
        },
      },
      assignments: {
        select: {
          id: true,
          title: true,
          subject: true,
          level: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-[var(--surm-paper)]">
      {/* Hero Banner Section */}
      <div className="relative w-full h-64 bg-[var(--surm-green)] rounded-b-3xl overflow-hidden mb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--surm-green)]/90 to-[var(--surm-green-soft)]/80"></div>
        <div className="relative container mx-auto px-4 py-12 h-full flex flex-col justify-center">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-semibold text-white mb-2">Teacher Dashboard</h1>
              <p className="text-lg text-white/90 font-sans">Welcome, {user.name}</p>
            </div>
            <div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8 -mt-4">
        {/* Create Forms */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Create Material - Beige Panel */}
          <section className="rounded-2xl bg-[var(--surm-beige)] p-8">
            <h2 className="text-2xl font-serif font-semibold text-[var(--surm-text-dark)] mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Learning Material
            </h2>
            <p className="text-sm text-[var(--surm-text-dark)]/80 mb-6 font-sans">Add new learning materials for students</p>
            <CreateMaterialForm createMaterial={createMaterial} />
            </section>

          {/* Create Assignment - Dark Green Panel */}
          <section className="rounded-2xl bg-[var(--surm-green-soft)] p-8 text-white">
            <h2 className="text-2xl font-serif font-semibold text-white mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Assignment
            </h2>
            <p className="text-sm text-white/90 mb-6 font-sans">Add new assignments for students</p>
            <CreateAssignmentForm createAssignment={createAssignment} />
            </section>
        </div>

        {/* Client Component with Edit/Delete/Grades */}
        <TeacherDashboardClient
          initialMaterials={materials.map(m => ({
            ...m,
            attachments: m.attachments as any,
          }))}
          initialAssignments={assignments}
          students={students as any}
          grades={grades}
          formSubmissions={formSubmissions as any}
          assignmentSubmissions={assignmentSubmissions as any}
        />
      </div>
    </div>
  );
}
