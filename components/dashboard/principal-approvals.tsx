"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { SubmissionStatus } from "@prisma/client";
import { format } from "date-fns";
import { Check, X, FileText } from "lucide-react";

interface PendingLeave {
  id: string;
  type: string;
  status: string;
  metadata: any;
  createdAt: string;
  users: {
    id: string;
    name: string;
    email: string;
    employmentType: string | null;
  };
}

export function PrincipalApprovals() {
  const { toast } = useToast();
  const [pendingLeaves, setPendingLeaves] = useState<PendingLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Action Dialog State
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: "APPROVE" | "REJECT" | null; id: string | null }>({ open: false, type: null, id: null });
  const [comments, setComments] = useState("");

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await fetch("/api/leave/approvals");
      if (res.ok) {
        const data = await res.json();
        setPendingLeaves(data);
      }
    } catch (error) {
      console.error("Failed to fetch pending leaves", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionDialog.id || !actionDialog.type) return;

    setProcessingId(actionDialog.id);
    try {
        const status = actionDialog.type === "APPROVE" ? SubmissionStatus.APPROVED : SubmissionStatus.REJECTED;
        
        const res = await fetch(`/api/leave/${actionDialog.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, comments })
        });

        if (!res.ok) throw new Error("Failed to update status");

        toast({ title: "Success", description: `Leave request ${status.toLowerCase()} successfully` });
        fetchPending();
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

  if (loading) return <div>Loading approvals...</div>;

  return (
    <div className="space-y-4">
        <h2 className="text-xl font-semibold">Pending Approvals</h2>
        {pendingLeaves.length === 0 ? (
            <p className="text-muted-foreground">No pending leave requests.</p>
        ) : (
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Teacher</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Days</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pendingLeaves.map((leave) => {
                            const meta = leave.metadata || {};
                            return (
                                <TableRow key={leave.id}>
                                    <TableCell>
                                        <div className="font-medium">{leave.users.name}</div>
                                        <div className="text-xs text-muted-foreground">{leave.users.employmentType?.replace(/_/g, " ") || "Unknown"}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{leave.type.replace(/_/g, " ")}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {meta.startDate ? format(new Date(meta.startDate), "MMM d") : "-"} 
                                            {" - "}
                                            {meta.endDate ? format(new Date(meta.endDate), "MMM d, yyyy") : "-"}
                                        </div>
                                    </TableCell>
                                    <TableCell>{meta.days || 0}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={meta.reason}>{meta.reason || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => openActionDialog(leave.id, "APPROVE")}>
                                                <Check className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => openActionDialog(leave.id, "REJECT")}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        )}

        <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ ...actionDialog, open: false })}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{actionDialog.type === "APPROVE" ? "Approve" : "Reject"} Leave Request</DialogTitle>
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
