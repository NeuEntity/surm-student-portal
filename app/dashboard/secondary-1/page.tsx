import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Level } from "@prisma/client";
import StudentDashboard from "@/components/dashboard/student-dashboard";

export default async function Secondary1Page() {
  const session = await auth();
  const user = session?.user as any;

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "STUDENT" || user.level !== "SECONDARY_1") {
    redirect("/dashboard");
  }

  const materials = await prisma.learning_materials.findMany({
    where: { level: Level.SECONDARY_1 },
    orderBy: { createdAt: "desc" },
  });

  const assignments = await prisma.assignments.findMany({
    where: { level: Level.SECONDARY_1 },
    orderBy: { dueDate: "asc" },
  });

  const submissions = await prisma.submissions.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const grades = await prisma.grades.findMany({
    where: { studentId: user.id },
    include: {
      assignments: {
        select: {
          title: true,
          subject: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <StudentDashboard
      level={Level.SECONDARY_1}
      userName={user.name}
      materials={materials.map(m => ({
        ...m,
        attachments: m.attachments as any,
      }))}
      assignments={assignments}
      submissions={submissions}
      grades={grades}
      userId={user.id}
    />
  );
}

