import { auth } from "@/auth";
import AdminLeaveManagement from "@/components/dashboard/admin-leave-management";
import { redirect } from "next/navigation";

export default async function AdminLeavesPage() {
  const session = await auth();
  const user = session?.user as any;

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
        <section className="rounded-2xl bg-white border border-[var(--surm-green-soft)]/20 p-8 mb-8 shadow-sm">
           <AdminLeaveManagement />
        </section>
    </div>
  );
}
