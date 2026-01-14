import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, BookOpen, FileText, Upload } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import AdminUserManagement from "@/components/dashboard/admin-user-management";
import AdminLeaveManagement from "@/components/dashboard/admin-leave-management";

export default async function AdminDashboardPage() {
  const session = await auth();
  const user = session?.user as any;

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.users.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      level: true,
      icNumber: true,
      phoneNumber: true,
      parentName: true,
      parentPhone: true,
      className: true,
      teacherRoles: true,
      classesTaught: true,
      employmentType: true,
      createdAt: true,
      _count: {
        select: {
          submissions: true,
          grades: true,
        },
      },
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

  return (
    <div className="min-h-screen bg-[var(--surm-paper)]">
      {/* Hero Banner Section */}
      <div className="relative w-full h-64 bg-[var(--surm-green)] rounded-b-3xl overflow-hidden mb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--surm-green)]/90 to-[var(--surm-green-soft)]/80"></div>
        <div className="relative container mx-auto px-4 py-12 h-full flex flex-col justify-center">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-semibold text-white mb-2">Admin Dashboard</h1>
              <p className="text-lg text-white/90 font-sans">Welcome, {user.name}</p>
            </div>
            <div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8 -mt-4">
        {/* Statistics Cards - Alternating Panels */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
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

        {/* User Management with CRUD - Beige Panel */}
        <section className="rounded-2xl bg-[var(--surm-beige)] p-8 mb-8">
          <h2 className="text-2xl font-serif font-semibold text-[var(--surm-text-dark)] mb-2">
            User Management
          </h2>
          <p className="text-sm text-[var(--surm-text-dark)]/80 mb-6 font-sans">
            Create, edit, and manage all users in the system
          </p>
          <div className="bg-white rounded-xl p-6">
            <AdminUserManagement initialUsers={users} currentUserId={user.id} />
          </div>
        </section>

        {/* Leave Management System - White/Green Panel */}
        <section className="rounded-2xl bg-white border border-[var(--surm-green-soft)]/20 p-8 mb-8 shadow-sm">
           <AdminLeaveManagement />
        </section>

        {/* Additional Statistics by Level */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Students by Level - Dark Green Panel */}
          <section className="rounded-2xl bg-[var(--surm-green-soft)] p-8 text-white">
            <h2 className="text-2xl font-serif font-semibold text-white mb-2">
              Students by Level
            </h2>
            <p className="text-sm text-white/90 mb-6 font-sans">Distribution across all levels</p>
            <div className="space-y-3">
              {["SECONDARY_1", "SECONDARY_2", "SECONDARY_3", "SECONDARY_4"].map(
                (level) => {
                  const count = users.filter(
                    (u) => u.role === "STUDENT" && u.level === level
                  ).length;
                  return (
                    <div
                      key={level}
                      className="flex items-center justify-between py-3 border-b border-white/20 last:border-0"
                    >
                      <span className="text-sm font-medium font-sans text-white">
                        {formatLevel(level)}
                      </span>
                      <span className="text-sm font-sans text-white/90">
                        {count} {count === 1 ? "student" : "students"}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </section>

          {/* Recent Activity - Beige Panel */}
          <section className="rounded-2xl bg-[var(--surm-beige)] p-8">
            <h2 className="text-2xl font-serif font-semibold text-[var(--surm-text-dark)] mb-2">
              Recent Activity
            </h2>
            <p className="text-sm text-[var(--surm-text-dark)]/80 mb-6 font-sans">Latest submissions</p>
            <div className="space-y-2">
              {submissionsCount === 0 ? (
                <p className="text-sm text-[var(--surm-text-dark)]/70 text-center py-4 font-sans">
                  No submissions yet
                </p>
              ) : (
                <div className="text-sm text-[var(--surm-text-dark)]/80 font-sans">
                  <p>Total submissions: {submissionsCount}</p>
                  <p className="mt-2 text-xs text-[var(--surm-text-dark)]/60">
                    Detailed activity logs can be implemented here
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

