import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/dashboard/admin-sidebar";
import { AdminHeader } from "@/components/dashboard/admin-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user as any;

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[var(--surm-paper)] flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 border-r border-[var(--surm-text-dark)]/10 bg-[var(--surm-paper)]">
        <AdminSidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <AdminHeader user={user} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
