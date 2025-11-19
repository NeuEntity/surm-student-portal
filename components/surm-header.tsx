"use client";

import { LogoutButton } from "@/components/logout-button";
import { BookOpen } from "lucide-react";

interface SurmHeaderProps {
  title?: string;
  subtitle?: string;
  showLogout?: boolean;
}

export function SurmHeader({ title, subtitle, showLogout = true }: SurmHeaderProps) {
  return (
    <header className="bg-[var(--surm-green)] text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-xl font-serif font-semibold text-white">
                {title || "SURM Student Portal"}
              </h1>
              {subtitle && (
                <p className="text-sm text-white/90 mt-0.5 font-sans">{subtitle}</p>
              )}
            </div>
          </div>
          {showLogout && (
            <div className="flex items-center gap-4">
              <LogoutButton />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

