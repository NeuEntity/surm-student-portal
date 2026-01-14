"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Loader2, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar as CalendarIcon,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { SubmissionStatus, SubmissionType } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";

export default function AdminLeaveManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("applications");
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Data
  const [leaves, setLeaves] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<SubmissionType | "ALL">("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter, typeFilter, dateRange, activeTab]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeaves();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/leave/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (typeFilter !== "ALL") params.append("type", typeFilter);
      if (dateRange?.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange?.to) params.append("endDate", dateRange.to.toISOString());

      const res = await fetch(`/api/leave/all?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      }
    } catch (error) {
      console.error("Failed to fetch leaves", error);
      toast({ title: "Error", description: "Failed to fetch leave records", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Generate CSV
    const headers = ["Teacher Name", "Email", "Type", "Start Date", "End Date", "Days", "Reason", "Status", "Applied On"];
    const rows = leaves.map(leave => {
        const meta = leave.metadata;
        return [
            leave.users.name,
            leave.users.email,
            leave.type,
            meta?.startDate ? format(new Date(meta.startDate), "yyyy-MM-dd") : "-",
            meta?.endDate ? format(new Date(meta.endDate), "yyyy-MM-dd") : "-",
            meta?.days || 0,
            `"${(meta?.reason || "").replace(/"/g, '""')}"`, // Escape quotes
            leave.status,
            format(new Date(leave.createdAt), "yyyy-MM-dd HH:mm")
        ];
    });

    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leave_report_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
        case SubmissionStatus.APPROVED: return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200";
        case SubmissionStatus.REJECTED: return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200";
        default: return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[var(--surm-text-dark)]">Leave Management System</h2>
          <p className="text-sm text-muted-foreground">Track, manage, and report on teacher leaves and medical certificates.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={leaves.length === 0}>
                <Download className="w-4 h-4 mr-2" /> Export Report
            </Button>
            <Button onClick={fetchLeaves} variant="default" className="bg-[var(--surm-green)] hover:bg-[var(--surm-green)]/90">
                Refresh Data
            </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">All time records</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
                <p className="text-xs text-muted-foreground">Requires action</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved Leaves</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats?.approved || 0}</div>
                <p className="text-xs text-muted-foreground">Successfully processed</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Medical Certificates</CardTitle>
                <div className="h-4 w-4 text-red-500 font-bold">MC</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats?.mc || 0}</div>
                <p className="text-xs text-muted-foreground">Total MCs recorded</p>
            </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="applications" className="w-full" onValueChange={setActiveTab}>
        <TabsList>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="reports">Trends & Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="applications" className="space-y-4">
            {/* Filters */}
            <Card className="bg-slate-50">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Search Teacher</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search by name..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SubmissionStatus | "ALL")}>
                                <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Status</SelectItem>
                                    <SelectItem value={SubmissionStatus.PENDING}>Pending</SelectItem>
                                    <SelectItem value={SubmissionStatus.APPROVED}>Approved</SelectItem>
                                    <SelectItem value={SubmissionStatus.REJECTED}>Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Leave Type</Label>
                            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as SubmissionType | "ALL")}>
                                <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Types</SelectItem>
                                    <SelectItem value={SubmissionType.ANNUAL_LEAVE}>Annual Leave</SelectItem>
                                    <SelectItem value={SubmissionType.MEDICAL_CERT}>Medical Cert</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Date Range</Label>
                            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Teacher</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Days</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Attachment</TableHead>
                                <TableHead className="text-right">Applied On</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></TableCell></TableRow>
                            ) : leaves.length === 0 ? (
                                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No records found matching your filters.</TableCell></TableRow>
                            ) : (
                                leaves.map((leave) => {
                                    const meta = leave.metadata as any;
                                    return (
                                        <TableRow key={leave.id}>
                                            <TableCell>
                                                <div className="font-medium">{leave.users.name}</div>
                                                <div className="text-xs text-muted-foreground">{leave.users.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={leave.type === SubmissionType.MEDICAL_CERT ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700"}>
                                                    {leave.type.replace("_", " ")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {meta?.startDate ? (
                                                    <div className="flex flex-col text-sm">
                                                        <span>{format(new Date(meta.startDate), "MMM d, yyyy")}</span>
                                                        <span className="text-xs text-muted-foreground">to {format(new Date(meta.endDate), "MMM d, yyyy")}</span>
                                                    </div>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell>{meta?.days || "-"}</TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={meta?.reason}>{meta?.reason || "-"}</TableCell>
                                            <TableCell>
                                                <Badge className={getStatusBadge(leave.status)} variant="outline">
                                                    {leave.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {leave.fileUrl && leave.fileUrl !== "no-file-uploaded" ? (
                                                    <a href={leave.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100">
                                                        <FileText className="w-3 h-3 mr-1" /> View Doc
                                                    </a>
                                                ) : <span className="text-xs text-muted-foreground">-</span>}
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-muted-foreground">
                                                {format(new Date(leave.createdAt), "MMM d, HH:mm")}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="reports">
            <Card>
                <CardHeader>
                    <CardTitle>Leave Analysis & Trends</CardTitle>
                    <CardDescription>Detailed breakdown of leave patterns (Coming Soon)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <div className="bg-slate-100 p-4 rounded-full mb-4">
                            <CalendarIcon className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium">Advanced Reporting Module</h3>
                        <p className="text-sm max-w-md text-center mt-2">
                            This section will feature visual charts for monthly leave trends, MC frequency analysis, and departmental comparisons. 
                            Currently, you can use the "Export Report" button to analyze data in Excel.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
