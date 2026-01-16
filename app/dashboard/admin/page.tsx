import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Users, BookOpen, FileText, Upload } from "lucide-react";
import { AdminOverviewCharts } from "@/components/dashboard/admin-overview-charts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export default async function AdminDashboardPage() {
  const session = await auth();
  const user = session?.user as any;

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // We only need user count and distribution here, not full details of all users
  const users = await prisma.users.findMany({
    select: {
      role: true,
      level: true,
    },
  });

  const stats = {
    totalUsers: users.length,
    students: users.filter((u) => u.role === "STUDENT").length,
    teachers: users.filter((u) => u.role === "TEACHER").length,
    admins: users.filter((u) => u.role === "ADMIN").length,
  };

  const materialsCount = await prisma.learning_materials.count();
  const assignmentsCount = await prisma.assignments.count();
  const submissionsCount = await prisma.submissions.count();

  const formatLevel = (level: string | null) => {
    if (!level) return "-";
    return level.replace("_", " ").replace("SECONDARY", "Secondary");
  };

  // --- Prepare Data for Graphs ---

  // 1. Level Stats for Bar Chart
  const levels = ["SECONDARY_1", "SECONDARY_2", "SECONDARY_3", "SECONDARY_4"];
  const levelStats = levels.map((level) => {
      const count = users.filter((u) => u.role === "STUDENT" && u.level === level).length;
      return {
          label: formatLevel(level),
          count,
          percentage: stats.students > 0 ? Math.round((count / stats.students) * 100) : 0
      };
  });

  // 2. Submission Trends for Sparkline (Last 7 Days)
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i);
      return {
          start: startOfDay(d),
          end: endOfDay(d),
          label: format(d, "MMM d"), // e.g., "Oct 25"
      };
  });

  // We need to fetch counts for each day. 
  // Ideally we use a raw query or groupBy, but Prisma groupBy date is tricky across DBs.
  // We'll fetch all submissions from the last 7 days and aggregate in JS.
  const weekStart = last7Days[0].start;
  const recentSubmissions = await prisma.submissions.findMany({
      where: {
          createdAt: {
              gte: weekStart
          }
      },
      select: {
          createdAt: true
      }
  });

  const submissionTrend = last7Days.map(day => {
      const count = recentSubmissions.filter(s => 
          s.createdAt >= day.start && s.createdAt <= day.end
      ).length;
      
      return {
          date: day.label,
          count
      };
  });

  return (
    <div className="space-y-8">
      {/* Statistics Cards - Alternating Panels */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users - Beige Panel */}
        <section className="rounded-2xl bg-[var(--surm-beige)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-serif font-semibold text-[var(--surm-text-dark)]">Total Users</h3>
            <Users className="h-5 w-5 text-[var(--surm-text-dark)]/60" />
          </div>
          <div className="text-3xl font-bold font-serif text-[var(--surm-text-dark)] mb-2">{stats.totalUsers}</div>
          <p className="text-xs text-[var(--surm-text-dark)]/70 font-sans">
            {stats.students} students, {stats.teachers} teachers
          </p>
        </section>

        {/* Learning Materials - Dark Green Panel */}
        <section className="rounded-2xl bg-[var(--surm-green-soft)] p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-serif font-semibold text-white">Learning Materials</h3>
            <BookOpen className="h-5 w-5 text-white/80" />
          </div>
          <div className="text-3xl font-bold font-serif text-white mb-2">{materialsCount}</div>
          <p className="text-xs text-white/80 font-sans">
            Total materials created
          </p>
        </section>

        {/* Assignments - Beige Panel */}
        <section className="rounded-2xl bg-[var(--surm-beige)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-serif font-semibold text-[var(--surm-text-dark)]">Assignments</h3>
            <FileText className="h-5 w-5 text-[var(--surm-text-dark)]/60" />
          </div>
          <div className="text-3xl font-bold font-serif text-[var(--surm-text-dark)] mb-2">{assignmentsCount}</div>
          <p className="text-xs text-[var(--surm-text-dark)]/70 font-sans">
            Total assignments created
          </p>
        </section>

        {/* Submissions - Dark Green Panel */}
        <section className="rounded-2xl bg-[var(--surm-green-soft)] p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-serif font-semibold text-white">Submissions</h3>
            <Upload className="h-5 w-5 text-white/80" />
          </div>
          <div className="text-3xl font-bold font-serif text-white mb-2">{submissionsCount}</div>
          <p className="text-xs text-white/80 font-sans">
            Total files submitted
          </p>
        </section>
      </div>

      {/* Advanced Charts Section */}
      <AdminOverviewCharts 
          userStats={stats}
          levelStats={levelStats}
          submissionTrend={submissionTrend}
      />
    </div>
  );
}
