"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Loader2, 
  Search, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  MoreHorizontal,
  Check,
  X
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SubmissionStatus, SubmissionType } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AdminStudentSubmissions() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"ALL" | SubmissionType>("ALL");
  const [loading, setLoading] = useState(false);
  
  // Data
  const [submissions, setSubmissions] = useState<any[]>([]);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "ALL">("ALL");
  const [classFilter, setClassFilter] = useState("ALL");

  // Action Dialog
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: "APPROVE" | "REJECT" | null; id: string | null }>({ open: false, type: null, id: null });
  const [comments, setComments] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, activeTab, classFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubmissions();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (classFilter !== "ALL") params.append("class", classFilter);
      
      // Handle Type Filter based on Tab
      if (activeTab !== "ALL") {
        params.append("type", activeTab);
      } else {
        // Fetch all student related types
        // The API defaults to student types if no type is specified, but let's be explicit if needed
        // Or we can rely on client side filtering if the API returns mixed types? 
        // The API returns what's requested. Let's rely on API default or send multiple types?
        // Our API logic for type filter is single value. 
        // If activeTab is ALL, we don't send type, so it fetches default (MC, Dismissal, Letters)
      }

      const res = await fetch(`/api/submissions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // The API returns { data: [], meta: {} } for teachers/pagination, but for ADMIN it returns plain array in one branch
        // Let's check the API code again. 
        // For ADMIN: returns { data: [], meta: { page, limit } }
        setSubmissions(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch submissions", error);
      toast({ title: "Error", description: "Failed to fetch submission records", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionDialog.id || !actionDialog.type) return;

    setProcessingId(actionDialog.id);
    try {
        const status = actionDialog.type === "APPROVE" ? SubmissionStatus.APPROVED : SubmissionStatus.REJECTED;
        
        const res = await fetch(`/api/submissions/${actionDialog.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, comments })
        });

        if (!res.ok) throw new Error("Failed to update status");

        toast({ title: "Success", description: `Submission ${status.toLowerCase()} successfully` });
        fetchSubmissions();
        setActionDialog({ open: false, type: null, id: null });
        setComments("");
    } catch (error) {
        toast({ title: "Error", description: "Operation failed", variant: "destructive" });
    } finally {
        setProcessingId(null);
    }
  };

  const openActionDialog = (id: string, type: "APPROVE" | "REJECT") => {
    setActionDialog({ open: true, type, id });
    setComments("");
  };

  const handleExport = () => {
    const headers = ["Student Name", "Class", "Type", "Submission Date", "Status", "Details"];
    const rows = submissions.map(sub => {
        const meta = sub.metadata || {};
        let details = "";
        if (sub.type === "MEDICAL_CERT") details = `Reason: ${meta.reason}, Date: ${meta.date}`;
        else if (sub.type === "EARLY_DISMISSAL") details = `Reason: ${meta.reason}, Date: ${meta.day}/${meta.month}/${meta.year}`;
        else if (sub.type === "LETTERS") details = `Reason: ${meta.reason}, Date: ${meta.date}`;

        return [
            sub.users.name,
            sub.users.className || "N/A",
            sub.type,
            format(new Date(sub.createdAt), "yyyy-MM-dd HH:mm"),
            sub.status,
            `"${details.replace(/"/g, '""')}"`
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
    link.setAttribute("download", `student_submissions_${format(new Date(), "yyyyMMdd")}.csv`);
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

  const getTypeLabel = (type: string) => {
      switch(type) {
          case "MEDICAL_CERT": return "Medical Cert";
          case "EARLY_DISMISSAL": return "Early Dismissal";
          case "LETTERS": return "Letter";
          default: return type.replace("_", " ");
      }
  };

  const getDetails = (sub: any) => {
      const meta = sub.metadata || {};
      if (sub.type === "LETTERS") {
          return (
              <div className="text-sm">
                  <p className="font-medium text-xs text-muted-foreground">Parent: {meta.parentName}</p>
                  <p>{meta.reason}</p>
              </div>
          );
      }
      if (sub.type === "MEDICAL_CERT") {
          return <span className="text-sm">{meta.reason}</span>;
      }
      if (sub.type === "EARLY_DISMISSAL") {
          return (
             <div className="text-sm">
                 <p className="font-medium text-xs text-muted-foreground">Pickup: {meta.time} {meta.ampm}</p>
                 <p>{meta.reason}</p>
             </div>
          );
      }
      return <span className="text-sm text-muted-foreground">-</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[var(--surm-text-dark)]">Student Submissions</h2>
          <p className="text-sm text-muted-foreground">Manage letters, medical certificates, and early dismissal requests.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={submissions.length === 0}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button onClick={fetchSubmissions} variant="default" className="bg-[var(--surm-green)] hover:bg-[var(--surm-green)]/90">
                Refresh
            </Button>
        </div>
      </div>

      <Tabs defaultValue="ALL" className="w-full" onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="mb-4">
            <TabsTrigger value="ALL">All Submissions</TabsTrigger>
            <TabsTrigger value="LETTERS">Letters</TabsTrigger>
            <TabsTrigger value="MEDICAL_CERT">Medical Certs</TabsTrigger>
            <TabsTrigger value="EARLY_DISMISSAL">Early Dismissal</TabsTrigger>
        </TabsList>
        
        {/* Filters */}
        <Card className="bg-slate-50 mb-6">
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>Search Student</Label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search name..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                        <Label>Class</Label>
                        <Select value={classFilter} onValueChange={setClassFilter}>
                            <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Classes</SelectItem>
                                {/* Add class options dynamically or statically if known */}
                                <SelectItem value="Secondary 1">Secondary 1</SelectItem>
                                <SelectItem value="Secondary 2">Secondary 2</SelectItem>
                                <SelectItem value="Secondary 3">Secondary 3</SelectItem>
                                <SelectItem value="Secondary 4">Secondary 4</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Attachment</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></TableCell></TableRow>
                        ) : submissions.length === 0 ? (
                            <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No records found.</TableCell></TableRow>
                        ) : (
                            submissions.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell>
                                        <div className="font-medium">{sub.users.name}</div>
                                        <div className="text-xs text-muted-foreground">{sub.users.email}</div>
                                    </TableCell>
                                    <TableCell>{sub.users.className || "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{getTypeLabel(sub.type)}</Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                        {getDetails(sub)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{format(new Date(sub.createdAt), "MMM d, yyyy")}</div>
                                        <div className="text-xs text-muted-foreground">{format(new Date(sub.createdAt), "HH:mm")}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusBadge(sub.status)} variant="outline">
                                            {sub.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {sub.fileUrl && sub.fileUrl !== "no-file-uploaded" ? (
                                            <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100">
                                                <FileText className="w-3 h-3 mr-1" /> View
                                            </a>
                                        ) : <span className="text-xs text-muted-foreground">-</span>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {sub.status === "PENDING" && (
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => openActionDialog(sub.id, "APPROVE")}>
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => openActionDialog(sub.id, "REJECT")}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </Tabs>

      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ ...actionDialog, open: false })}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{actionDialog.type === "APPROVE" ? "Approve" : "Reject"} Submission</DialogTitle>
                    <DialogDescription>
                        Add optional comments for this action.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea 
                        placeholder="Comments (optional)" 
                        value={comments} 
                        onChange={(e) => setComments(e.target.value)} 
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setActionDialog({ ...actionDialog, open: false })}>Cancel</Button>
                    <Button 
                        variant={actionDialog.type === "APPROVE" ? "default" : "destructive"} 
                        onClick={handleAction}
                        disabled={!!processingId}
                    >
                        Confirm {actionDialog.type === "APPROVE" ? "Approval" : "Rejection"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
