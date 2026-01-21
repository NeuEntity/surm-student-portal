"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { format } from "date-fns";
import { Download, RefreshCw, Activity } from "lucide-react";
import { DateRange } from "react-day-picker";

// Types
interface AuditLog {
  id: string;
  action: string;
  entityId: string;
  entityType: string;
  actorId: string;
  actorName: string | null;
  actorRole: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  details: any;
  status: string;
  createdAt: string;
  actor?: {
    email: string;
    name: string;
  };
}

export default function AuditLogsClient() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  
  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      if (search) params.append("search", search);
      if (actionFilter !== "ALL") params.append("action", actionFilter);
      if (roleFilter !== "ALL") params.append("role", roleFilter);
      if (dateRange?.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange?.to) params.append("endDate", dateRange.to.toISOString());

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, actionFilter, roleFilter, dateRange]); 

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) setPagination(prev => ({ ...prev, page: 1 }));
      else fetchLogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleExport = (format: "csv" | "xlsx") => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (actionFilter !== "ALL") params.append("action", actionFilter);
    if (roleFilter !== "ALL") params.append("role", roleFilter);
    if (dateRange?.from) params.append("startDate", dateRange.from.toISOString());
    if (dateRange?.to) params.append("endDate", dateRange.to.toISOString());
    params.append("format", format);

    window.open(`/api/audit-logs/export?${params.toString()}`, "_blank");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CRITICAL": return "bg-red-100 text-red-800 border-red-200";
      case "WARNING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "INFO": return "bg-blue-100 text-blue-800 border-blue-200";
      case "SUCCESS": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
       <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">Recorded in selected period</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div className="flex flex-1 flex-col md:flex-row gap-2 md:items-center">
            <Input 
                placeholder="Search user, action, or entity ID..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
            />
             <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Action" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Actions</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="CREATE">Create</SelectItem>
                    <SelectItem value="UPDATE">Update</SelectItem>
                    <SelectItem value="DELETE">Delete</SelectItem>
                </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="TEACHER">Teacher</SelectItem>
                    <SelectItem value="STUDENT">Student</SelectItem>
                </SelectContent>
            </Select>
            <div className="w-[300px]">
                <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchLogs()}><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
            <Button variant="outline" onClick={() => handleExport("csv")}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">Loading logs...</TableCell></TableRow>
                ) : logs.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-24">No logs found.</TableCell></TableRow>
                ) : (
                    logs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell>{format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{log.actorName || "System"}</span>
                                    <span className="text-xs text-muted-foreground">{log.actorRole}</span>
                                </div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span>{log.entityType}</span>
                                    <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={log.entityId}>{log.entityId}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-sm font-mono">{log.ipAddress || "-"}</TableCell>
                            <TableCell>
                                <Badge className={getStatusColor(log.status)} variant="outline">{log.status}</Badge>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} 
            disabled={pagination.page <= 1}
        >
            Previous
        </Button>
        <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages || 1}
        </div>
        <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} 
            disabled={pagination.page >= pagination.pages}
        >
            Next
        </Button>
      </div>
    </div>
  );
}
