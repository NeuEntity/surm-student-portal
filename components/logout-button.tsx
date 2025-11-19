"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const handleLogout = async () => {
    // Sign out without redirect, then manually redirect to login
    // This ensures we use the current origin instead of NEXTAUTH_URL
    await signOut({ 
      redirect: false,
    });
    // Manually redirect to login using current origin
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <Button
      variant="default"
      size="default"
      onClick={handleLogout}
      className="inline-flex items-center gap-2 rounded-full bg-[var(--surm-accent)] text-white px-5 py-2 text-sm font-medium shadow-sm hover:bg-[#35803F] h-10"
    >
      <LogOut className="w-4 h-4" />
      Logout
    </Button>
  );
}

