import AuditLogsClient from "@/components/dashboard/audit-logs-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Logs | SURM Admin",
  description: "View and manage system audit logs",
};

export default function AuditLogsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
      </div>
      <AuditLogsClient />
    </div>
  );
}
