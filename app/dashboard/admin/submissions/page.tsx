import { auth } from "@/auth";
import AdminStudentSubmissions from "@/components/dashboard/admin-student-submissions";
import { redirect } from "next/navigation";

export default async function AdminSubmissionsPage() {
  const session = await auth();
  const user = session?.user as any;

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
        <section className="rounded-2xl bg-[var(--surm-beige)] p-8 mb-8">
           <AdminStudentSubmissions />
        </section>
    </div>
  );
}
