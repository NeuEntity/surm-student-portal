import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user as any;

  // This page should not be directly accessible - middleware handles routing
  // If user somehow reaches here, redirect based on role
  if (!user) {
    redirect("/login");
  }

  // Route based on user role (fallback if middleware didn't catch it)
  switch (user.role) {
    case "STUDENT":
      const level = user.level?.toLowerCase().replace("_", "-");
      if (level) {
        redirect(`/dashboard/${level}`);
      } else {
        redirect("/login");
      }
      break;

    case "TEACHER":
      redirect("/dashboard/teacher");
      break;

    case "ADMIN":
      redirect("/dashboard/admin");
      break;

    default:
      redirect("/login");
  }
}

