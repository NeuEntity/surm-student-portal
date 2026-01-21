"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  CalendarCheck,
  Settings,
  LogOut,
  Menu,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";

const sidebarItems = [
  {
    title: "Overview",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    title: "User Management",
    href: "/dashboard/admin/users",
    icon: Users,
  },
  {
    title: "Student Submissions",
    href: "/dashboard/admin/submissions",
    icon: FileText,
  },
  {
    title: "Leave Management",
    href: "/dashboard/admin/leaves",
    icon: CalendarCheck,
  },
  {
    title: "Audit Logs",
    href: "/dashboard/admin/audit-logs",
    icon: ShieldAlert,
  },
];

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn("pb-12 min-h-screen", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-serif font-bold tracking-tight text-[var(--surm-text-dark)]">
            Admin Portal
          </h2>
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start font-sans",
                  pathname === item.href 
                    ? "bg-[var(--surm-green-soft)]/10 text-[var(--surm-green-soft)] font-medium" 
                    : "text-[var(--surm-text-dark)]/70 hover:text-[var(--surm-text-dark)] hover:bg-[var(--surm-beige)]"
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="md:hidden pr-4">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[85vw] max-w-xs h-full max-h-screen p-0 gap-0 rounded-none border-r sm:rounded-none fixed left-0 top-0 translate-x-0 translate-y-0 data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-left-full data-[state=closed]:slide-out-to-top-0 data-[state=open]:slide-in-from-top-0">
         {/* Visually hidden title for accessibility */}
        <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
        <div className="px-7 py-6 border-b">
          <Link
            href="/dashboard/admin"
            className="flex items-center"
            onClick={() => setOpen(false)}
          >
            <span className="font-serif font-bold text-lg">Admin Portal</span>
          </Link>
        </div>
        <div className="mt-8 px-4">
            <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start font-sans",
                  pathname === item.href 
                    ? "bg-[var(--surm-green-soft)]/10 text-[var(--surm-green-soft)] font-medium" 
                    : "text-[var(--surm-text-dark)]/70 hover:text-[var(--surm-text-dark)] hover:bg-[var(--surm-beige)]"
                )}
                asChild
                onClick={() => setOpen(false)}
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
