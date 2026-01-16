"use client";

import { cn } from "@/lib/utils";
import { Users, FileText, Upload } from "lucide-react";

interface AdminOverviewChartsProps {
  userStats: {
    students: number;
    teachers: number;
    admins: number;
  };
  levelStats: {
    label: string;
    count: number;
    percentage: number;
  }[];
  submissionTrend: {
    date: string;
    count: number;
  }[];
}

export function AdminOverviewCharts({
  userStats,
  levelStats,
  submissionTrend,
}: AdminOverviewChartsProps) {
  const totalUsers = userStats.students + userStats.teachers + userStats.admins;
  
  // Calculate max for normalization
  const maxSubmission = Math.max(...submissionTrend.map(d => d.count), 1);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* 1. User Distribution - Donut Chart Style */}
      <section className="rounded-2xl bg-white p-6 shadow-sm border border-[var(--surm-text-dark)]/5 lg:col-span-1">
        <h3 className="text-lg font-serif font-bold text-[var(--surm-text-dark)] mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-[var(--surm-text-dark)]/60" />
          User Distribution
        </h3>
        
        <div className="flex flex-col items-center justify-center py-4">
            {/* CSS Conic Gradient Donut Chart */}
            <div 
                className="relative w-48 h-48 rounded-full mb-6 flex items-center justify-center shadow-inner"
                style={{
                    background: `conic-gradient(
                        var(--surm-green-soft) 0% ${(userStats.students / totalUsers) * 100}%,
                        var(--surm-beige) ${(userStats.students / totalUsers) * 100}% ${(userStats.students + userStats.teachers) / totalUsers * 100}%,
                        var(--surm-accent) ${(userStats.students + userStats.teachers) / totalUsers * 100}% 100%
                    )`
                }}
            >
                <div className="absolute w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                    <span className="text-3xl font-serif font-bold text-[var(--surm-text-dark)]">{totalUsers}</span>
                    <span className="text-xs text-[var(--surm-text-dark)]/60 uppercase tracking-wider">Total Users</span>
                </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--surm-green-soft)]"></div>
                    <div>
                        <p className="text-xs text-[var(--surm-text-dark)]/60 uppercase">Students</p>
                        <p className="font-semibold text-[var(--surm-text-dark)]">{userStats.students}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--surm-beige)]"></div>
                    <div>
                        <p className="text-xs text-[var(--surm-text-dark)]/60 uppercase">Teachers</p>
                        <p className="font-semibold text-[var(--surm-text-dark)]">{userStats.teachers}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--surm-accent)]"></div>
                    <div>
                        <p className="text-xs text-[var(--surm-text-dark)]/60 uppercase">Admins</p>
                        <p className="font-semibold text-[var(--surm-text-dark)]">{userStats.admins}</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* 2. Students by Level - Horizontal Bar Chart */}
      <section className="rounded-2xl bg-[var(--surm-green-soft)] p-6 text-white lg:col-span-1 flex flex-col">
        <h3 className="text-lg font-serif font-bold text-white mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-white/80" />
          Students by Level
        </h3>
        
        <div className="flex-1 flex flex-col justify-center gap-5">
            {levelStats.map((stat) => (
                <div key={stat.label} className="group">
                    <div className="flex justify-between text-sm mb-1.5 font-sans">
                        <span className="font-medium text-white/90">{stat.label}</span>
                        <span className="text-white/70">{stat.count} ({stat.percentage}%)</span>
                    </div>
                    <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <div 
                            className="h-full bg-white/90 rounded-full transition-all duration-1000 ease-out group-hover:bg-white group-hover:shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                            style={{ width: `${stat.percentage}%` }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* 3. Submission Activity - Sparkline / Trend */}
      <section className="rounded-2xl bg-[var(--surm-beige)] p-6 lg:col-span-1 flex flex-col">
        <h3 className="text-lg font-serif font-bold text-[var(--surm-text-dark)] mb-2 flex items-center gap-2">
          <Upload className="w-5 h-5 text-[var(--surm-text-dark)]/60" />
          Submission Trend
        </h3>
        <p className="text-sm text-[var(--surm-text-dark)]/60 mb-8 font-sans">Last 7 Days Activity</p>

        <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-2">
            {submissionTrend.map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2 group w-full">
                    <div className="relative w-full flex items-end justify-center h-40">
                         {/* Tooltip */}
                         <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--surm-text-dark)] text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                            {item.count} submissions
                        </div>
                        
                        {/* Bar */}
                        <div 
                            className="w-full max-w-[24px] bg-[var(--surm-accent)]/80 rounded-t-md transition-all duration-500 hover:bg-[var(--surm-accent)] hover:shadow-md"
                            style={{ height: `${(item.count / maxSubmission) * 100}%`, minHeight: '4px' }}
                        ></div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-[var(--surm-text-dark)]/40">{item.date}</span>
                </div>
            ))}
        </div>
      </section>
    </div>
  );
}
