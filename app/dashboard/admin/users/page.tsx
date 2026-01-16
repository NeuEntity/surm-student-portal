import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AdminUserManagement from "@/components/dashboard/admin-user-management";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-[var(--surm-beige)] p-8 mb-8">
          <h2 className="text-2xl font-serif font-semibold text-[var(--surm-text-dark)] mb-2">
            User Management
          </h2>
          <p className="text-sm text-[var(--surm-text-dark)]/80 mb-6 font-sans">
            Create, edit, and manage all users in the system
          </p>
          <div className="bg-white rounded-xl p-6">
            <AdminUserManagement initialUsers={users} currentUserId={user.id} />
          </div>
      </div>
    </div>
  );
}
