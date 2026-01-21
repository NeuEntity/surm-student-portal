"use client";

import { useState } from "react";
import { Role, Level } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  className?: string | null;
  teacherRoles?: string[];
  classesTaught?: string[];
  employmentType?: "FULL_TIME" | "PERMANENT_PART_TIME" | "PART_TIME" | null;
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

const TEACHER_ROLES = [
  { value: "TAHFIZ", label: "Tahfiz Teacher" },
  { value: "FORM", label: "Form Teacher" },
  { value: "PRINCIPAL", label: "Principal" },
];

const LEVELS_TAUGHT = [
  { value: "SECONDARY_1", label: "Secondary 1" },
  { value: "SECONDARY_2", label: "Secondary 2" },
  { value: "SECONDARY_3", label: "Secondary 3" },
  { value: "SECONDARY_4", label: "Secondary 4" },
];

const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PERMANENT_PART_TIME", label: "Permanent Part Time" },
  { value: "PART_TIME", label: "Part Time" },
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
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<string>("");
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [levelFilter, setLevelFilter] = useState<Level | "all">("all");

  // State for multi-selects
  const [selectedTeacherRoles, setSelectedTeacherRoles] = useState<string[]>([]);
  const [selectedClassesTaught, setSelectedClassesTaught] = useState<string[]>([]);

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "STUDENT":
        return "bg-[var(--surm-beige)]/50 text-[var(--surm-text-dark)] hover:bg-[var(--surm-beige)]/60";
      case "TEACHER":
        return "bg-[var(--surm-green-soft)]/30 text-[var(--surm-text-dark)] hover:bg-[var(--surm-green-soft)]/40";
      case "ADMIN":
        return "bg-[var(--surm-accent)]/20 text-[var(--surm-text-dark)] hover:bg-[var(--surm-accent)]/30";
      default:
        return "bg-[var(--surm-paper)] text-[var(--surm-text-dark)]";
    }
  };

  const getTeacherRoleBadgeClass = (role: string) => {
    switch (role) {
        case "TAHFIZ":
            return "bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200";
        case "FORM":
            return "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200";
        case "PRINCIPAL":
            return "bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200";
        default:
            return "bg-gray-100 text-gray-800";
    }
  };

  const getClassBadgeClass = (className: string) => {
    switch (className) {
        case "SECONDARY_1": return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
        case "SECONDARY_2": return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
        case "SECONDARY_3": return "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200";
        case "SECONDARY_4": return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200";
        default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatLevel = (level: Level | null) => {
    if (!level) return "-";
    return level.replace("_", " ").replace("SECONDARY", "Secondary");
  };

  const getRoleLabel = (role: string) => {
    return ROLES.find(r => r.value === role)?.label || role;
  };

  const getTeacherRoleLabel = (role: string) => {
    return TEACHER_ROLES.find(r => r.value === role)?.label || role;
  };

  const getEmploymentLabel = (type: string) => {
    return EMPLOYMENT_TYPES.find(t => t.value === type)?.label || type.replace(/_/g, " ");
  };

  // Filter users by level and role
  const filteredUsers = users.filter(user => {
    if (levelFilter !== "all" && user.level !== levelFilter) {
      return false;
    }
    return true;
  });

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: any = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
      level: formData.get("level"),
    };

    if (data.role === Role.TEACHER) {
      data.teacherRoles = selectedTeacherRoles;
      data.classesTaught = selectedClassesTaught;
      data.employmentType = selectedEmploymentType;
    }

    if (data.role === Role.STUDENT) {
        data.className = formData.get("className");
        data.icNumber = formData.get("icNumber");
        data.phoneNumber = formData.get("phoneNumber");
        data.parentName = formData.get("parentName");
        data.parentPhone = formData.get("parentPhone");
    }

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
        setSelectedTeacherRoles([]);
        setSelectedClassesTaught([]);
        setSelectedEmploymentType("");
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

    if (data.role === Role.TEACHER) {
        data.teacherRoles = selectedTeacherRoles;
        data.classesTaught = selectedClassesTaught;
        data.employmentType = selectedEmploymentType;
    }

    if (data.role === Role.STUDENT) {
        data.className = formData.get("className");
        data.icNumber = formData.get("icNumber");
        data.phoneNumber = formData.get("phoneNumber");
        data.parentName = formData.get("parentName");
        data.parentPhone = formData.get("parentPhone");
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

  // ... (handleDeleteUser, handleBulkUpload, downloadTemplate - Same as original)
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
      setUploadResults({ error: "Please select a file" });
      setUploading(false);
      return;
    }
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      const res = await fetch("/api/users/bulk-upload", { method: "POST", body: uploadFormData });
      const data = await res.json();
      if (res.ok) {
        setUploadResults(data);
        if (data.summary.success > 0) router.refresh();
      } else {
        setUploadResults({ error: data.error || "Failed to upload file" });
      }
    } catch (error: any) {
      setUploadResults({ error: error.message || "Failed to upload file" });
    } finally {
      setUploading(false);
    }
  }

  function downloadTemplate() {
    const templateData = [
      ["name", "email", "password", "role", "level", "icNumber", "phoneNumber", "parentName", "parentPhone", "className"],
      ["Ahmad", "ahmad@surm.edu", "pass123", "STUDENT", "SECONDARY_1", "123", "012", "Abdullah", "019", "5A"],
      ["Ustaz", "teacher@surm.edu", "pass123", "TEACHER", "", "", "", "", "", ""],
    ];
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
          {/* Bulk Upload Dialog */}
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
                {/* ... Template Info ... */}
                <div className="p-4 bg-[var(--surm-beige)]/30 border border-[var(--surm-beige)] rounded-md">
                  <div className="flex items-start gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-[var(--surm-text-dark)]/70 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[var(--surm-text-dark)] mb-2">File Format Requirements:</p>
                      <ul className="text-xs text-[var(--surm-text-dark)]/80 space-y-1 list-disc list-inside">
                        <li>Headers: name, email, password, role, level, icNumber, phoneNumber, parentName, parentPhone, className</li>
                        <li>Role: STUDENT, TEACHER, ADMIN</li>
                        <li>Level required for STUDENT</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={downloadTemplate} className="w-full">
                  <Download className="w-4 h-4 mr-2" /> Download Template (CSV)
                </Button>
                <form onSubmit={handleBulkUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-file">Select Excel or CSV File</Label>
                    <Input id="bulk-file" name="file" type="file" accept=".xlsx,.xls,.csv" required disabled={uploading} />
                  </div>
                  {uploadResults && (
                    <div className="space-y-2">
                      {uploadResults.error ? (
                        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{uploadResults.error}</AlertDescription></Alert>
                      ) : (
                        <div className="space-y-3">
                           <div className="p-4 bg-[var(--surm-beige)]/30 border border-[var(--surm-beige)] rounded-md">
                            <p className="text-sm font-semibold text-[var(--surm-text-dark)] mb-2">Upload Summary:</p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-[var(--surm-text-dark)]/80">
                              <div>Total: {uploadResults.summary.total}</div>
                              <div className="text-[var(--surm-accent)] font-semibold">Success: {uploadResults.summary.success}</div>
                              <div className="text-[var(--surm-text-dark)]/80 font-semibold">Skipped: {uploadResults.summary.skipped}</div>
                              <div className="text-red-600 font-semibold">Errors: {uploadResults.summary.errors}</div>
                            </div>
                          </div>
                          {/* Details (Simplified for brevity in update) */}
                        </div>
                      )}
                    </div>
                  )}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => { setBulkUploadOpen(false); setUploadResults(null); }} disabled={uploading}>{uploadResults ? "Close" : "Cancel"}</Button>
                    <Button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Upload File"}</Button>
                  </DialogFooter>
                </form>
              </div>
            </DialogContent>
          </Dialog>

          {/* Create User Dialog */}
          <Dialog open={createDialogOpen} onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) {
              setSelectedRole("");
              setSelectedTeacherRoles([]);
              setSelectedClassesTaught([]);
              setSelectedEmploymentType("");
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new student, teacher, or admin to the system</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="create-name">Full Name *</Label><Input id="create-name" name="name" required /></div>
                <div className="space-y-2"><Label htmlFor="create-email">Email *</Label><Input id="create-email" name="email" type="email" required /></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="create-password">Password *</Label><Input id="create-password" name="password" type="password" required /></div>
                <div className="space-y-2">
                  <Label htmlFor="create-role">Role *</Label>
                  <Select name="role" required onValueChange={(value) => setSelectedRole(value as Role)}>
                    <SelectTrigger id="create-role"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>{ROLES.map((role) => (<SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              
              {selectedRole === Role.STUDENT && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="create-level">Level *</Label>
                      <Select name="level" required>
                        <SelectTrigger id="create-level"><SelectValue placeholder="Select level" /></SelectTrigger>
                        <SelectContent>{LEVELS.map((level) => (<SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label htmlFor="create-class">Class Name</Label><Input id="create-class" name="className" placeholder="e.g. 5A" /></div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><Label htmlFor="create-ic">IC Number</Label><Input id="create-ic" name="icNumber" placeholder="e.g., 123" /></div>
                    <div className="space-y-2"><Label htmlFor="create-phone">Phone</Label><Input id="create-phone" name="phoneNumber" type="tel" /></div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><Label htmlFor="create-pname">Parent Name</Label><Input id="create-pname" name="parentName" /></div>
                    <div className="space-y-2"><Label htmlFor="create-pphone">Parent Phone</Label><Input id="create-pphone" name="parentPhone" type="tel" /></div>
                  </div>
                </>
              )}

              {selectedRole === Role.TEACHER && (
                <div className="space-y-4 border p-4 rounded-md bg-slate-50">
                    <h4 className="font-semibold text-sm">Teacher Permissions</h4>
                    <div className="space-y-2">
                        <Label>Roles</Label>
                        <div className="flex flex-col gap-2">
                            {TEACHER_ROLES.map((role) => (
                                <div key={role.value} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`role-${role.value}`} 
                                        checked={selectedTeacherRoles.includes(role.value)}
                                        onCheckedChange={(checked) => {
                                            if (checked) setSelectedTeacherRoles([...selectedTeacherRoles, role.value]);
                                            else setSelectedTeacherRoles(selectedTeacherRoles.filter(r => r !== role.value));
                                        }}
                                    />
                                    <Label htmlFor={`role-${role.value}`}>{role.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="create-employment">Employment Type</Label>
                        <Select name="employmentType" required onValueChange={(value) => setSelectedEmploymentType(value)}>
                            <SelectTrigger id="create-employment"><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                                {EMPLOYMENT_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Classes Taught (Levels)</Label>
                        <div className="flex flex-col gap-2">
                            {LEVELS_TAUGHT.map((level) => (
                                <div key={level.value} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`class-${level.value}`} 
                                        checked={selectedClassesTaught.includes(level.value)}
                                        onCheckedChange={(checked) => {
                                            if (checked) setSelectedClassesTaught([...selectedClassesTaught, level.value]);
                                            else setSelectedClassesTaught(selectedClassesTaught.filter(c => c !== level.value));
                                        }}
                                    />
                                    <Label htmlFor={`class-${level.value}`}>{level.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create User"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

        <Tabs defaultValue="teachers" className="w-full">
            <TabsList className="mb-4">
                <TabsTrigger value="teachers">Teachers & Staff</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="admins">Admins</TabsTrigger>
            </TabsList>
            
            <TabsContent value="teachers">
                <div className="rounded-xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Roles & Employment</TableHead>
                                <TableHead>Classes</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.filter(u => u.role === Role.TEACHER).map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1.5 items-center max-w-[200px]">
                                            <Badge className={getRoleBadgeClass(user.role)} variant="outline">
                                                {getRoleLabel(user.role)}
                                            </Badge>
                                            {user.role === Role.TEACHER && (
                                                <>
                                                    {user.teacherRoles?.map(role => (
                                                        <Badge key={role} variant="outline" className={getTeacherRoleBadgeClass(role)}>
                                                            {getTeacherRoleLabel(role)}
                                                        </Badge>
                                                    ))}
                                                    {user.employmentType && (
                                                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100">
                                                            {getEmploymentLabel(user.employmentType)}
                                                        </Badge>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {user.role === Role.TEACHER && user.classesTaught && user.classesTaught.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {user.classesTaught.map(cls => (
                                                    <Badge key={cls} variant="outline" className={getClassBadgeClass(cls)}>
                                                        {cls.replace("SECONDARY_", "S")}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => {
                                                setEditingUser(user);
                                                setEditRole(user.role);
                                                if (user.role === Role.TEACHER) {
                                                    setSelectedTeacherRoles(user.teacherRoles || []);
                                                    setSelectedClassesTaught(user.classesTaught || []);
                                                    setSelectedEmploymentType(user.employmentType || "");
                                                }
                                                setEditDialogOpen(true);
                                            }}><Edit className="w-4 h-4" /></Button>
                                            {user.id !== currentUserId && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button size="sm" variant="destructive" className="bg-red-600 hover:bg-red-700 text-white border-red-700"><Trash2 className="w-4 h-4 text-white" /></Button></AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Delete User?</AlertDialogTitle><AlertDialogDescription>This will permanently delete {user.name}.</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction></AlertDialogFooter>
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
            </TabsContent>

            <TabsContent value="students">
                <div className="rounded-xl overflow-hidden">
                    <div className="mb-4 flex items-center gap-2">
                        <Label className="text-sm font-semibold text-[var(--surm-text-dark)]">Filter by Level:</Label>
                        <Select value={levelFilter} onValueChange={(value) => setLevelFilter(value as Level | "all")}>
                            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All Levels</SelectItem>{LEVELS.map((level) => (<SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>))}</SelectContent>
                        </Select>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Level & Class</TableHead>
                                <TableHead>Parent Info</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.filter(u => u.role === Role.STUDENT).map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {user.level && (
                                                <Badge variant="outline" className={getClassBadgeClass(user.level)}>
                                                    {formatLevel(user.level)}
                                                </Badge>
                                            )}
                                            {user.className && (
                                                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 w-fit">
                                                    Class: {user.className}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs text-muted-foreground">
                                            <div>{user.parentName || "-"}</div>
                                            <div>{user.parentPhone || "-"}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => {
                                                setEditingUser(user);
                                                setEditRole(user.role);
                                                setEditDialogOpen(true);
                                            }}><Edit className="w-4 h-4" /></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button size="sm" variant="destructive" className="bg-red-600 hover:bg-red-700 text-white border-red-700"><Trash2 className="w-4 h-4 text-white" /></Button></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Delete User?</AlertDialogTitle><AlertDialogDescription>This will permanently delete {user.name}.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>

            <TabsContent value="admins">
                <div className="rounded-xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.filter(u => u.role === Role.ADMIN).map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell><Badge className={getRoleBadgeClass(user.role)} variant="outline">{getRoleLabel(user.role)}</Badge></TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => {
                                                setEditingUser(user);
                                                setEditRole(user.role);
                                                setEditDialogOpen(true);
                                            }}><Edit className="w-4 h-4" /></Button>
                                            {user.id !== currentUserId && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button size="sm" variant="destructive" className="bg-red-600 hover:bg-red-700 text-white border-red-700"><Trash2 className="w-4 h-4 text-white" /></Button></AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Delete User?</AlertDialogTitle><AlertDialogDescription>This will permanently delete {user.name}.</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction></AlertDialogFooter>
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
            </TabsContent>
        </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setEditingUser(null);
          setEditRole("");
          setSelectedTeacherRoles([]);
          setSelectedClassesTaught([]);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit User</DialogTitle><DialogDescription>Update user information</DialogDescription></DialogHeader>
          {editingUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="edit-name">Full Name *</Label><Input id="edit-name" name="name" defaultValue={editingUser.name} required /></div>
                <div className="space-y-2"><Label htmlFor="edit-email">Email *</Label><Input id="edit-email" name="email" type="email" defaultValue={editingUser.email} required /></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="edit-password">New Password</Label><Input id="edit-password" name="password" type="password" placeholder="Leave blank to keep current" /></div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role *</Label>
                  <Select name="role" defaultValue={editingUser.role} required onValueChange={(value) => setEditRole(value as Role)}>
                    <SelectTrigger id="edit-role"><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLES.map((role) => (<SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>

              {editRole === Role.STUDENT && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-level">Level *</Label>
                      <Select name="level" defaultValue={editingUser.level || ""} required>
                        <SelectTrigger id="edit-level"><SelectValue placeholder="Select level" /></SelectTrigger>
                        <SelectContent>{LEVELS.map((level) => (<SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label htmlFor="edit-class">Class Name</Label><Input id="edit-class" name="className" defaultValue={editingUser.className || ""} placeholder="e.g. 5A" /></div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><Label htmlFor="edit-ic">IC Number</Label><Input id="edit-ic" name="icNumber" defaultValue={editingUser.icNumber || ""} /></div>
                    <div className="space-y-2"><Label htmlFor="edit-phone">Phone</Label><Input id="edit-phone" name="phoneNumber" type="tel" defaultValue={editingUser.phoneNumber || ""} /></div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><Label htmlFor="edit-pname">Parent Name</Label><Input id="edit-pname" name="parentName" defaultValue={editingUser.parentName || ""} /></div>
                    <div className="space-y-2"><Label htmlFor="edit-pphone">Parent Phone</Label><Input id="edit-pphone" name="parentPhone" type="tel" defaultValue={editingUser.parentPhone || ""} /></div>
                  </div>
                </>
              )}

              {editRole === Role.TEACHER && (
                <div className="space-y-4 border p-4 rounded-md bg-slate-50">
                    <h4 className="font-semibold text-sm">Teacher Permissions</h4>
                    <div className="space-y-2">
                        <Label>Roles</Label>
                        <div className="flex flex-col gap-2">
                            {TEACHER_ROLES.map((role) => (
                                <div key={role.value} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`edit-role-${role.value}`} 
                                        checked={selectedTeacherRoles.includes(role.value)}
                                        onCheckedChange={(checked) => {
                                            if (checked) setSelectedTeacherRoles([...selectedTeacherRoles, role.value]);
                                            else setSelectedTeacherRoles(selectedTeacherRoles.filter(r => r !== role.value));
                                        }}
                                    />
                                    <Label htmlFor={`edit-role-${role.value}`}>{role.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-employment">Employment Type</Label>
                        <Select name="employmentType" defaultValue={editingUser.employmentType || ""} required onValueChange={(value) => setSelectedEmploymentType(value)}>
                            <SelectTrigger id="edit-employment"><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                                {EMPLOYMENT_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Classes Taught (Levels)</Label>
                        <div className="flex flex-col gap-2">
                            {LEVELS_TAUGHT.map((level) => (
                                <div key={level.value} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`edit-class-${level.value}`} 
                                        checked={selectedClassesTaught.includes(level.value)}
                                        onCheckedChange={(checked) => {
                                            if (checked) setSelectedClassesTaught([...selectedClassesTaught, level.value]);
                                            else setSelectedClassesTaught(selectedClassesTaught.filter(c => c !== level.value));
                                        }}
                                    />
                                    <Label htmlFor={`edit-class-${level.value}`}>{level.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setEditDialogOpen(false); setEditingUser(null); }}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Updating..." : "Save Changes"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
