"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { format, differenceInDays } from "date-fns";
import { Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { SubmissionType, SubmissionStatus } from "@prisma/client";
import { DateRange } from "react-day-picker";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface LeaveManagementProps {
  userId: string;
}

export function LeaveManagement({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [balance, setBalance] = useState<any>(null); // Type this properly if we had shared types
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  
  // Form State
  const [leaveType, setLeaveType] = useState<SubmissionType | "">("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchBalance();
    fetchHistory();
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/leave/balance");
      if (res.ok) {
        const data = await res.json();
        setBalance(data);
      }
    } catch (error) {
      console.error("Failed to fetch balance", error);
    }
  };

  const fetchHistory = async () => {
    try {
        const res = await fetch(`/api/leave/all?teacherId=${userId}`);
        if (res.ok) {
            const data = await res.json();
            setHistory(data);
        }
    } catch (error) {
        console.error("Failed to fetch history", error);
    }
  };

  const calculateDays = () => {
    if (!dateRange?.from || !dateRange?.to) return 0;
    // Inclusive +1
    return differenceInDays(dateRange.to, dateRange.from) + 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveType || !dateRange?.from || !dateRange?.to || !reason) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let fileUrl = "";
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            fileUrl = uploadData.url;
        } else {
             // Fallback or error
        }
      }

      const days = calculateDays();
      
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: leaveType,
          fileUrl, 
          metadata: {
            startDate: dateRange.from.toISOString(),
            endDate: dateRange.to.toISOString(),
            days,
            reason
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");

      toast({ title: "Success", description: "Leave request submitted successfully" });
      fetchBalance(); // Refresh balance
      fetchHistory(); // Refresh history
      // Reset form
      setLeaveType("");
      setDateRange(undefined);
      setReason("");
      setFile(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: SubmissionStatus) => {
      switch (status) {
          case SubmissionStatus.APPROVED: return "bg-green-100 text-green-800 hover:bg-green-200";
          case SubmissionStatus.REJECTED: return "bg-red-100 text-red-800 hover:bg-red-200";
          default: return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      }
  };

  if (!balance) return <div>Loading leave details...</div>;

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Annual Leave</CardTitle></CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{balance.annualLeave.remaining} / {balance.annualLeave.total}</div>
                <p className="text-xs text-muted-foreground">{balance.annualLeave.used} used, {balance.annualLeave.pending} pending</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Medical Leave</CardTitle></CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{balance.medicalLeave.remaining} / {balance.medicalLeave.total}</div>
                <p className="text-xs text-muted-foreground">{balance.medicalLeave.used} used, {balance.medicalLeave.pending} pending</p>
            </CardContent>
        </Card>
      </div>

      {/* Application Form */}
      <Card>
        <CardHeader><CardTitle>Apply for Leave</CardTitle></CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Leave Type</Label>
                        <Select value={leaveType} onValueChange={(v) => setLeaveType(v as SubmissionType)}>
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={SubmissionType.ANNUAL_LEAVE}>Annual Leave</SelectItem>
                                <SelectItem value={SubmissionType.MEDICAL_CERT}>Medical Leave (MC)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Dates ({calculateDays()} days)</Label>
                        <DatePickerWithRange 
                            date={dateRange}
                            setDate={setDateRange}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Reason</Label>
                    <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for leave" required />
                </div>

                {leaveType === SubmissionType.MEDICAL_CERT && (
                    <div className="space-y-2">
                        <Label>Medical Certificate (PDF/Image)</Label>
                        <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
                    </div>
                )}

                <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Application"}
                </Button>
            </form>
        </CardContent>
      </Card>

      {/* Leave History */}
      <Card>
          <CardHeader><CardTitle>Application History</CardTitle></CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Attachment</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {history.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-4">No applications found</TableCell></TableRow>
                      ) : (
                          history.map((leave) => {
                              const meta = leave.metadata as any;
                              return (
                                  <TableRow key={leave.id}>
                                      <TableCell className="font-medium">{leave.type.replace("_", " ")}</TableCell>
                                      <TableCell>
                                          {meta?.startDate ? (
                                              <>
                                                  {format(new Date(meta.startDate), "MMM d")} - {format(new Date(meta.endDate), "MMM d, yyyy")}
                                              </>
                                          ) : format(new Date(leave.createdAt), "MMM d, yyyy")}
                                      </TableCell>
                                      <TableCell>{meta?.days || "-"}</TableCell>
                                      <TableCell>{meta?.reason || "-"}</TableCell>
                                      <TableCell>
                                          <Badge className={getStatusBadge(leave.status)} variant="outline">{leave.status}</Badge>
                                      </TableCell>
                                      <TableCell>
                                          {leave.fileUrl && leave.fileUrl !== "no-file-uploaded" ? (
                                              <a href={leave.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                                  <FileText className="w-4 h-4" /> View
                                              </a>
                                          ) : "-"}
                                      </TableCell>
                                  </TableRow>
                              );
                          })
                      )}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
  );
}
