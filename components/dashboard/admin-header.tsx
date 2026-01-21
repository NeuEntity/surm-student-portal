"use client";

import { ProfileMenu } from "@/components/profile/profile-menu";
import { MobileNav } from "./admin-sidebar";
import { usePathname } from "next/navigation";

interface AdminHeaderProps {
  user: any;
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname.includes("/users")) return "User Management";
    if (pathname.includes("/submissions")) return "Student Submissions";
    if (pathname.includes("/leaves")) return "Leave Management";
    return "Dashboard Overview";
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[var(--surm-text-dark)]/10 bg-[var(--surm-paper)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--surm-paper)]/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <MobileNav />
          <div className="flex flex-col">
            <h1 className="text-lg font-serif font-semibold text-[var(--surm-text-dark)] hidden md:block">
              {getPageTitle()}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <ProfileMenu user={user} />
        </div>
      </div>
    </header>
  );
}
