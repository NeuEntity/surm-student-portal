import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  // Root page - let middleware handle routing to avoid redirect loops
  // Only redirect if we have a clearly valid session
  try {
    const session = await auth();
    
    // Only redirect if session exists AND has valid user with required fields
    if (session?.user?.id && session?.user?.role) {
      redirect("/dashboard");
    } else {
      redirect("/login");
    }
  } catch (error: any) {
    // Check if this is a Next.js redirect error - if so, re-throw it
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    // If auth check fails, just redirect to login
    console.error("Root page: Auth check failed:", error);
    redirect("/login");
  }
}

