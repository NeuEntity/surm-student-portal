"use client";

import { useState } from "react";
import { Role, Level } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit, Trash2, Users, Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  level: Level | null;
  icNumber?: string | null;
  phoneNumber?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  createdAt: Date;
  _count: {
    submissions: number;
    grades: number;
  };
};

const ROLES = [
  { value: Role.STUDENT, label: "Student" },
  { value: Role.TEACHER, label: "Teacher" },
  { value: Role.ADMIN, label: "Admin" },
];

const LEVELS = [
  { value: Level.SECONDARY_1, label: "Secondary 1" },
  { value: Level.SECONDARY_2, label: "Secondary 2" },
  { value: Level.SECONDARY_3, label: "Secondary 3" },
  { value: Level.SECONDARY_4, label: "Secondary 4" },
];

export default function AdminUserManagement({
  initialUsers,
  currentUserId,
}: {
  initialUsers: User[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | "">("");
  const [editRole, setEditRole] = useState<Role | "">("");
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [levelFilter, setLevelFilter] = useState<Level | "all">("all");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "STUDENT":
        return "bg-[var(--surm-beige)]/50 text-[var(--surm-text-dark)]";
      case "TEACHER":
        return "bg-[var(--surm-green-soft)]/30 text-[var(--surm-text-dark)]";
      case "ADMIN":
        return "bg-[var(--surm-accent)]/20 text-[var(--surm-text-dark)]";
      default:
        return "bg-[var(--surm-paper)] text-[var(--surm-text-dark)]";
    }
  };

  const formatLevel = (level: Level | null) => {
    if (!level) return "-";
    return level.replace("_", " ").replace("SECONDARY", "Secondary");
  };

  // Filter users by level and role
  const filteredUsers = users.filter(user => {
    if (levelFilter !== "all" && user.level !== levelFilter) {
      return false;
    }
    if (roleFilter !== "all" && user.role !== roleFilter) {
      return false;
    }
    return true;
  });

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
      level: formData.get("level"),
    };

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const newUser = await res.json();
        setUsers([newUser, ...users]);
        setCreateDialogOpen(false);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: any = {
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
      level: formData.get("level"),
    };

    const password = formData.get("password") as string;
    if (password && password.trim() !== "") {
      data.password = password;
    }

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const updated = await res.json();
        setUsers(users.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
        setEditDialogOpen(false);
        setEditingUser(null);
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(id: string) {
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });

      if (res.ok) {
        setUsers(users.filter((u) => u.id !== id));
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  }

  async function handleBulkUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    setUploadResults(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;

    if (!file) {
      setUploadResults({
        error: "Please select a file",
      });
      setUploading(false);
      return;
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const res = await fetch("/api/users/bulk-upload", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await res.json();

      if (res.ok) {
        setUploadResults(data);
        if (data.summary.success > 0) {
          router.refresh();
        }
      } else {
        setUploadResults({
          error: data.error || "Failed to upload file",
        });
      }
    } catch (error: any) {
      setUploadResults({
        error: error.message || "Failed to upload file",
      });
    } finally {
      setUploading(false);
    }
  }

  function downloadTemplate() {
    // Create template data
    const templateData = [
      ["name", "email", "password", "role", "level", "icNumber", "phoneNumber", "parentName", "parentPhone"],
      ["Ahmad bin Abdullah", "ahmad@surm.edu", "password123", "STUDENT", "SECONDARY_1", "123456789012", "0123456789", "Abdullah bin Ahmad", "0198765432"],
      ["Fatimah binti Hassan", "fatimah@surm.edu", "password123", "STUDENT", "SECONDARY_2", "987654321098", "0123456788", "Hassan bin Ali", "0198765433"],
      ["Ustaz Rahman", "teacher2@surm.edu", "password123", "TEACHER", "", "", "", "", ""],
    ];

    // Convert to CSV
    const csv = templateData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user_upload_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-semibold text-[var(--surm-text-dark)]">User Management</h2>
        <div className="flex gap-2">
          <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Bulk Upload Users</DialogTitle>
                <DialogDescription>
                  Upload an Excel file (.xlsx, .xls) or CSV file to create multiple users at once
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-[var(--surm-beige)]/30 border border-[var(--surm-beige)] rounded-md">
                  <div className="flex items-start gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-[var(--surm-text-dark)]/70 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[var(--surm-text-dark)] mb-2">
                        File Format Requirements:
                      </p>
                      <ul className="text-xs text-[var(--surm-text-dark)]/80 space-y-1 list-disc list-inside">
                        <li>First row must be headers: name, email, password, role, level, icNumber, phoneNumber, parentName, parentPhone</li>
                        <li>Role must be: STUDENT, TEACHER, or ADMIN</li>
                        <li>Level is required for STUDENT role: SECONDARY_1, SECONDARY_2, SECONDARY_3, or SECONDARY_4</li>
                        <li>Level should be empty for TEACHER and ADMIN</li>
                        <li>Student-specific fields (icNumber, phoneNumber, parentName, parentPhone) are optional and only used for STUDENT role</li>
                        <li>Email must be unique</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadTemplate}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template (CSV)
                </Button>

                <form onSubmit={handleBulkUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-file">Select Excel or CSV File</Label>
                    <Input
                      id="bulk-file"
                      name="file"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      required
                      disabled={uploading}
                    />
                  </div>

                  {uploadResults && (
                    <div className="space-y-2">
                      {uploadResults.error ? (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{uploadResults.error}</AlertDescription>
                        </Alert>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-4 bg-[var(--surm-beige)]/30 border border-[var(--surm-beige)] rounded-md">
                            <p className="text-sm font-semibold text-[var(--surm-text-dark)] mb-2">
                              Upload Summary:
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-[var(--surm-text-dark)]/80">
                              <div>Total Rows: {uploadResults.summary.total}</div>
                              <div className="text-[var(--surm-accent)] font-semibold">
                                Success: {uploadResults.summary.success}
                              </div>
                              <div className="text-[var(--surm-text-dark)]/80 font-semibold">
                                Skipped: {uploadResults.summary.skipped}
                              </div>
                              <div className="text-red-600 font-semibold">
                                Errors: {uploadResults.summary.errors}
                              </div>
                            </div>
                          </div>

                          {uploadResults.details?.errors && uploadResults.details.errors.length > 0 && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md max-h-40 overflow-y-auto">
                              <p className="text-xs font-semibold text-red-900 mb-1">Errors:</p>
                              <ul className="text-xs text-red-800 space-y-0.5">
                                {uploadResults.details.errors.map((error: string, idx: number) => (
                                  <li key={idx}>• {error}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {uploadResults.details?.skipped && uploadResults.details.skipped.length > 0 && (
                            <div className="p-3 bg-[var(--surm-beige)]/50 border border-[var(--surm-beige)] rounded-md max-h-40 overflow-y-auto">
                              <p className="text-xs font-semibold text-[var(--surm-text-dark)] mb-1">Skipped:</p>
                              <ul className="text-xs text-[var(--surm-text-dark)]/80 space-y-0.5">
                                {uploadResults.details.skipped.map((msg: string, idx: number) => (
                                  <li key={idx}>• {msg}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {uploadResults.details?.success && uploadResults.details.success.length > 0 && (
                            <div className="p-3 bg-[var(--surm-beige)]/30 border border-[var(--surm-beige)] rounded-md max-h-40 overflow-y-auto">
                              <p className="text-xs font-semibold text-[var(--surm-text-dark)] mb-1">Success:</p>
                              <ul className="text-xs text-[var(--surm-text-dark)]/80 space-y-0.5">
                                {uploadResults.details.success.slice(0, 10).map((msg: string, idx: number) => (
                                  <li key={idx}>• {msg}</li>
                                ))}
                                {uploadResults.details.success.length > 10 && (
                                  <li className="text-[var(--surm-accent)]">
                                    ... and {uploadResults.details.success.length - 10} more
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setBulkUploadOpen(false);
                        setUploadResults(null);
                      }}
                      disabled={uploading}
                    >
                      {uploadResults ? "Close" : "Cancel"}
                    </Button>
                    <Button type="submit" disabled={uploading}>
                      {uploading ? "Uploading..." : "Upload File"}
                    </Button>
                  </DialogFooter>
                </form>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={createDialogOpen} onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) {
              setSelectedRole("");
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new student, teacher, or admin to the system
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Full Name *</Label>
                  <Input id="create-name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-email">Email *</Label>
                  <Input id="create-email" name="email" type="email" required />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="create-password">Password *</Label>
                  <Input id="create-password" name="password" type="password" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-role">Role *</Label>
                  <Select name="role" required onValueChange={(value) => setSelectedRole(value as Role)}>
                    <SelectTrigger id="create-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedRole === Role.STUDENT && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="create-level">Level * (Required for Students)</Label>
                    <Select name="level" required>
                      <SelectTrigger id="create-level">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="create-ic">IC Number</Label>
                      <Input id="create-ic" name="icNumber" placeholder="e.g., 123456789012" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="create-phone">Student Phone Number</Label>
                      <Input id="create-phone" name="phoneNumber" type="tel" placeholder="e.g., 0123456789" />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="create-parent-name">Parent Name</Label>
                      <Input id="create-parent-name" name="parentName" placeholder="Parent full name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="create-parent-phone">Parent Phone Number</Label>
                      <Input id="create-parent-phone" name="parentPhone" type="tel" placeholder="e.g., 0123456789" />
                    </div>
                  </div>
                </>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden">
        <div className="mb-4">
          <h3 className="text-lg font-serif font-semibold text-[var(--surm-text-dark)] mb-1">All Users</h3>
          <p className="text-sm text-[var(--surm-text-dark)]/70 font-sans">Manage user accounts and permissions</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="role-filter" className="text-sm font-semibold text-[var(--surm-text-dark)]">
              Filter by Role:
            </Label>
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as Role | "all")}>
              <SelectTrigger id="role-filter" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="level-filter" className="text-sm font-semibold text-[var(--surm-text-dark)]">
              Filter by Level:
            </Label>
            <Select value={levelFilter} onValueChange={(value) => setLevelFilter(value as Level | "all")}>
              <SelectTrigger id="level-filter" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>IC Number</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>{formatLevel(user.level)}</TableCell>
                <TableCell>{user.role === "STUDENT" ? (user.icNumber || "-") : "-"}</TableCell>
                <TableCell>{user.role === "STUDENT" ? (user.phoneNumber || "-") : "-"}</TableCell>
                <TableCell>{user.role === "STUDENT" ? (user.parentName ? `${user.parentName} (${user.parentPhone || "N/A"})` : "-") : "-"}</TableCell>
                <TableCell>{user._count?.submissions ?? 0}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingUser(user);
                        setEditRole(user.role);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {user.id !== currentUserId && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="bg-red-600 hover:bg-red-700 text-white border-red-700">
                            <Trash2 className="w-4 h-4 text-white" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete {user.name} ({user.email}) and all their associated data. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-red-600 hover:bg-red-700 text-white">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setEditingUser(null);
          setEditRole("");
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingUser.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={editingUser.email}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
                  <Input
                    id="edit-password"
                    name="password"
                    type="password"
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role *</Label>
                  <Select 
                    name="role" 
                    defaultValue={editingUser.role} 
                    required
                    onValueChange={(value) => setEditRole(value as Role)}
                  >
                    <SelectTrigger id="edit-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {editRole === Role.STUDENT && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-level">
                      Level * (Required for Students)
                    </Label>
                    <Select name="level" defaultValue={editingUser.level || ""} required>
                      <SelectTrigger id="edit-level">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-ic">IC Number</Label>
                      <Input id="edit-ic" name="icNumber" defaultValue={(editingUser as any).icNumber || ""} placeholder="e.g., 123456789012" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Student Phone Number</Label>
                      <Input id="edit-phone" name="phoneNumber" type="tel" defaultValue={(editingUser as any).phoneNumber || ""} placeholder="e.g., 0123456789" />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-parent-name">Parent Name</Label>
                      <Input id="edit-parent-name" name="parentName" defaultValue={(editingUser as any).parentName || ""} placeholder="Parent full name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-parent-phone">Parent Phone Number</Label>
                      <Input id="edit-parent-phone" name="parentPhone" type="tel" defaultValue={(editingUser as any).parentPhone || ""} placeholder="e.g., 0123456789" />
                    </div>
                  </div>
                </>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setEditDialogOpen(false);
                  setEditingUser(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

