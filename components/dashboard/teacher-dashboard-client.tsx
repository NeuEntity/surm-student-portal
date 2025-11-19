"use client";

import { useState, useEffect } from "react";
import { Level, Subject, SubmissionType, SubmissionStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BookOpen, FileText, Plus, Edit, Trash2, GraduationCap, FileCheck } from "lucide-react";
import { useRouter } from "next/navigation";

type MaterialAttachment = {
  url: string;
  name?: string | null;
  type?: string | null;
  size?: number | null;
};

type Material = {
  id: string;
  title: string;
  description: string;
  level: Level;
  subject: Subject;
  videoUrl?: string | null;
  fileUrl?: string | null;
  attachments?: MaterialAttachment[] | null;
};

type Assignment = {
  id: string;
  title: string;
  description: string;
  level: Level;
  subject: Subject;
  dueDate: Date;
};

type Student = {
  id: string;
  name: string;
  email: string;
  level: Level;
};

type Grade = {
  id: string;
  studentId: string;
  assignmentId: string;
  score: number;
  maxScore: number;
  feedback: string | null;
  users: {
    name: string;
    email: string;
  };
  assignments: {
    title: string;
    subject: Subject;
  };
};

type FormSubmission = {
  id: string;
  userId: string;
  type: SubmissionType;
  fileUrl: string;
  status: SubmissionStatus;
  createdAt: Date;
  updatedAt: Date;
  metadata: any;
  users: {
    id: string;
    name: string;
    email: string;
    level: Level | null;
  };
};

type AssignmentSubmission = {
  id: string;
  userId: string;
  type: SubmissionType;
  fileUrl: string;
  status: SubmissionStatus;
  assignmentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  users: {
    id: string;
    name: string;
    email: string;
    level: Level | null;
  };
  assignments: {
    id: string;
    title: string;
    subject: Subject;
    level: Level;
  } | null;
};

const SUBJECTS = [
  { value: Subject.AKIDAH, label: "Akidah" },
  { value: Subject.AKHLAK, label: "Akhlak" },
  { value: Subject.FIQH, label: "Fiqh" },
  { value: Subject.FARAIDH, label: "Faraidh" },
  { value: Subject.SIRAH, label: "Sirah" },
  { value: Subject.HADIS, label: "Hadis" },
  { value: Subject.MUSTOLAH_HADIS, label: "Mustolah Hadis" },
  { value: Subject.ENGLISH, label: "English" },
  { value: Subject.MALAY, label: "Malay" },
  { value: Subject.ARABIC, label: "Arabic" },
  { value: Subject.MATHS, label: "Maths" },
  { value: Subject.IRK, label: "IRK" },
];

const LEVELS = [
  { value: Level.SECONDARY_1, label: "Secondary 1" },
  { value: Level.SECONDARY_2, label: "Secondary 2" },
  { value: Level.SECONDARY_3, label: "Secondary 3" },
  { value: Level.SECONDARY_4, label: "Secondary 4" },
];

export default function TeacherDashboardClient({
  initialMaterials,
  initialAssignments,
  students,
  grades: initialGrades,
  formSubmissions: initialFormSubmissions,
  assignmentSubmissions: initialAssignmentSubmissions,
}: {
  initialMaterials: Material[];
  initialAssignments: Assignment[];
  students: Student[];
  grades: Grade[];
  formSubmissions: FormSubmission[];
  assignmentSubmissions: AssignmentSubmission[];
}) {
  const router = useRouter();
  const [materials, setMaterials] = useState(initialMaterials);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [grades, setGrades] = useState(initialGrades);
  const [formSubmissions, setFormSubmissions] = useState(initialFormSubmissions);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState(initialAssignmentSubmissions);
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null);
  const [gradeDialog, setGradeDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [gradeScore, setGradeScore] = useState<string>("");
  const [gradeMaxScore, setGradeMaxScore] = useState<string>("100");
  const [gradeFeedback, setGradeFeedback] = useState<string>("");
  
  // Level filters for each tab
  const [materialsLevelFilter, setMaterialsLevelFilter] = useState<Level | "all">("all");
  const [assignmentsLevelFilter, setAssignmentsLevelFilter] = useState<Level | "all">("all");
  const [gradesLevelFilter, setGradesLevelFilter] = useState<Level | "all">("all");
  const [formsLevelFilter, setFormsLevelFilter] = useState<Level | "all">("all");
  const [gradeStudentFilter, setGradeStudentFilter] = useState<string>("all");
  
  // Subject filters for each tab
  const [materialsSubjectFilter, setMaterialsSubjectFilter] = useState<Subject | "all">("all");
  const [assignmentsSubjectFilter, setAssignmentsSubjectFilter] = useState<Subject | "all">("all");
  const [gradesSubjectFilter, setGradesSubjectFilter] = useState<Subject | "all">("all");

  // Sync state with props when they change (after page refresh)
  useEffect(() => {
    setMaterials(initialMaterials);
    setAssignments(initialAssignments);
    setGrades(initialGrades);
    setFormSubmissions(initialFormSubmissions);
    setAssignmentSubmissions(initialAssignmentSubmissions);
  }, [initialMaterials, initialAssignments, initialGrades, initialFormSubmissions, initialAssignmentSubmissions]);

  // Filter materials by level and subject
  const filteredMaterials = materials.filter(m => {
    if (materialsLevelFilter !== "all" && m.level !== materialsLevelFilter) {
      return false;
    }
    if (materialsSubjectFilter !== "all" && m.subject !== materialsSubjectFilter) {
      return false;
    }
    return true;
  });

  // Filter assignments by level and subject
  const filteredAssignments = assignments.filter(a => {
    if (assignmentsLevelFilter !== "all" && a.level !== assignmentsLevelFilter) {
      return false;
    }
    if (assignmentsSubjectFilter !== "all" && a.subject !== assignmentsSubjectFilter) {
      return false;
    }
    return true;
  });

  // Filter grades by level, subject, and student
  const filteredGrades = grades.filter(g => {
    // Find the student for this grade
    const student = students.find(s => s.id === g.studentId);
    if (!student) return false;
    
    // Filter by level
    if (gradesLevelFilter !== "all" && student.level !== gradesLevelFilter) {
      return false;
    }
    
    // Filter by subject
    if (gradesSubjectFilter !== "all" && g.assignments.subject !== gradesSubjectFilter) {
      return false;
    }
    
    // Filter by student
    if (gradeStudentFilter !== "all" && g.studentId !== gradeStudentFilter) {
      return false;
    }
    
    return true;
  });

  // Filter form submissions by level
  const filteredFormSubmissions = formsLevelFilter === "all"
    ? formSubmissions
    : formSubmissions.filter(f => f.users.level === formsLevelFilter);

  // Get students filtered by level for grade management
  const filteredStudentsForGrades = gradesLevelFilter === "all"
    ? students
    : students.filter(s => s.level === gradesLevelFilter);

  async function handleDeleteMaterial(id: string) {
    try {
      const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to delete material");
      }
    } catch (error) {
      console.error("Error deleting material:", error);
      alert("Failed to delete material. Please try again.");
    }
  }

  async function handleDeleteAssignment(id: string) {
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to delete assignment");
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Failed to delete assignment. Please try again.");
    }
  }

  async function handleUpdateMaterial(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editMaterial) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      level: editMaterial.level, // Use current editMaterial state for level
      subject: editMaterial.subject, // Use current editMaterial state for subject
      videoUrl: formData.get("videoUrl") || null,
      fileUrl: formData.get("fileUrl") || null,
    };

    try {
      const res = await fetch(`/api/materials/${editMaterial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.refresh();
        setEditMaterial(null);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update material");
      }
    } catch (error) {
      console.error("Error updating material:", error);
      alert("Failed to update material. Please try again.");
    }
  }

  async function handleUpdateAssignment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editAssignment) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      level: editAssignment.level, // Use current editAssignment state for level
      subject: editAssignment.subject, // Use current editAssignment state for subject
      dueDate: formData.get("dueDate"),
    };

    try {
      const res = await fetch(`/api/assignments/${editAssignment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.refresh();
        setEditAssignment(null);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update assignment");
      }
    } catch (error) {
      console.error("Error updating assignment:", error);
      alert("Failed to update assignment. Please try again.");
    }
  }

  async function handleSubmitGrade(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!selectedStudent || !selectedAssignment || !gradeScore) {
      alert("Please fill in all required fields");
      return;
    }
    
    const data = {
      studentId: selectedStudent,
      assignmentId: selectedAssignment,
      score: gradeScore,
      maxScore: gradeMaxScore || "100",
      feedback: gradeFeedback || null,
    };

    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        // Reset form
        setSelectedStudent("");
        setSelectedAssignment("");
        setGradeScore("");
        setGradeMaxScore("100");
        setGradeFeedback("");
        setGradeDialog(false);
        // Refresh the page to get updated grades
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to submit grade");
      }
    } catch (error) {
      console.error("Error submitting grade:", error);
      alert("Failed to submit grade. Please try again.");
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="materials" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-3xl bg-white rounded-full p-1">
          <TabsTrigger value="materials" className="rounded-full font-sans">
            <BookOpen className="w-4 h-4 mr-2" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="assignments" className="rounded-full font-sans">
            <FileText className="w-4 h-4 mr-2" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="grades" className="rounded-full font-sans">
            <GraduationCap className="w-4 h-4 mr-2" />
            Grades
          </TabsTrigger>
          <TabsTrigger value="submissions" className="rounded-full font-sans">
            <FileCheck className="w-4 h-4 mr-2" />
            Forms
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          {/* Level and Subject Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="materials-level-filter" className="text-sm font-semibold text-[var(--surm-text-dark)]">
                Filter by Level:
              </Label>
              <Select value={materialsLevelFilter} onValueChange={(value) => setMaterialsLevelFilter(value as Level | "all")}>
                <SelectTrigger id="materials-level-filter" className="w-48">
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
            <div className="flex items-center gap-2">
              <Label htmlFor="materials-subject-filter" className="text-sm font-semibold text-[var(--surm-text-dark)]">
                Filter by Subject:
              </Label>
              <Select value={materialsSubjectFilter} onValueChange={(value) => setMaterialsSubjectFilter(value as Subject | "all")}>
                <SelectTrigger id="materials-subject-filter" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject.value} value={subject.value}>
                      {subject.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {filteredMaterials.length === 0 ? (
            <div className="rounded-xl p-12 bg-white border border-[var(--surm-green)]/20 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-[var(--surm-text-dark)]/40" />
              <p className="text-lg font-semibold text-[var(--surm-text-dark)] mb-2">No learning materials yet</p>
              <p className="text-sm text-[var(--surm-text-dark)]/60">Create your first learning material using the form above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMaterials.map((material) => {
                return (
                  <section
                    key={material.id}
                    className="rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start bg-white border border-[var(--surm-green)]/20 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <h3 className="text-xl font-serif font-semibold mb-2 text-[var(--surm-text-dark)]">
                        {material.title}
                      </h3>
                      <p className="text-sm mb-3 font-sans description-text text-[var(--surm-text-dark)]/70">
                        {material.description.substring(0, 150)}
                        {material.description.length > 150 && "..."}
                      </p>
                      <div className="flex gap-4 text-xs font-sans text-[var(--surm-text-dark)]/60">
                        <span>{LEVELS.find((l) => l.value === material.level)?.label}</span>
                        <span>{SUBJECTS.find((s) => s.value === material.subject)?.label}</span>
                      </div>
                      {material.attachments && material.attachments.length > 0 && (
                        <div className="mt-3 text-xs font-sans">
                          <p className="font-semibold text-[var(--surm-text-dark)] mb-1">Uploaded Files</p>
                          <div className="space-y-1">
                            {material.attachments.map((attachment, idx) => (
                              <a
                                key={`${attachment.url}-${idx}`}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-[var(--surm-text-dark)]/70 hover:text-[var(--surm-accent)]"
                              >
                                <FileText className="w-3 h-3" />
                                {attachment.name || `Attachment ${idx + 1}`}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditMaterial(material)}
                        className="rounded-full"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="rounded-full bg-red-600 hover:bg-red-700 text-white border-red-700">
                            <Trash2 className="w-4 h-4 text-white" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Material?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete &quot;{material.title}&quot;. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteMaterial(material.id)} className="bg-red-600 hover:bg-red-700 text-white">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          {/* Level and Subject Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="assignments-level-filter" className="text-sm font-semibold text-[var(--surm-text-dark)]">
                Filter by Level:
              </Label>
              <Select value={assignmentsLevelFilter} onValueChange={(value) => setAssignmentsLevelFilter(value as Level | "all")}>
                <SelectTrigger id="assignments-level-filter" className="w-48">
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
            <div className="flex items-center gap-2">
              <Label htmlFor="assignments-subject-filter" className="text-sm font-semibold text-[var(--surm-text-dark)]">
                Filter by Subject:
              </Label>
              <Select value={assignmentsSubjectFilter} onValueChange={(value) => setAssignmentsSubjectFilter(value as Subject | "all")}>
                <SelectTrigger id="assignments-subject-filter" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject.value} value={subject.value}>
                      {subject.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {filteredAssignments.length === 0 ? (
            <div className="rounded-xl p-12 bg-white border border-[var(--surm-green)]/20 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-[var(--surm-text-dark)]/40" />
              <p className="text-lg font-semibold text-[var(--surm-text-dark)] mb-2">No assignments yet</p>
              <p className="text-sm text-[var(--surm-text-dark)]/60">Create your first assignment using the form above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment) => {
                const submissionsForAssignment = assignmentSubmissions.filter(
                  (sub) => sub.assignmentId === assignment.id
                );
                
                return (
                  <section
                    key={assignment.id}
                    className="rounded-xl p-6 bg-white border border-[var(--surm-green)]/20 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-serif font-semibold mb-2 text-[var(--surm-text-dark)]">
                          {assignment.title}
                        </h3>
                        <p className="text-sm mb-3 font-sans description-text text-[var(--surm-text-dark)]/70">
                          {assignment.description.substring(0, 150)}
                          {assignment.description.length > 150 && "..."}
                        </p>
                        <div className="flex gap-4 text-xs font-sans text-[var(--surm-text-dark)]/60 mb-4">
                          <span>{LEVELS.find((l) => l.value === assignment.level)?.label}</span>
                          <span>{SUBJECTS.find((s) => s.value === assignment.subject)?.label}</span>
                          <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        </div>
                        
                        {/* Submissions Section */}
                        {submissionsForAssignment.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-[var(--surm-green)]/20">
                            <p className="text-sm font-semibold font-sans text-[var(--surm-text-dark)] mb-3">
                              Student Submissions ({submissionsForAssignment.length})
                            </p>
                            <div className="space-y-3">
                              {submissionsForAssignment.map((submission) => {
                                const statusColor = 
                                  submission.status === "APPROVED" ? "text-green-600 bg-green-50" :
                                  submission.status === "REJECTED" ? "text-red-600 bg-red-50" :
                                  "text-yellow-600 bg-yellow-50";
                                
                                const statusLabel = submission.status.charAt(0) + submission.status.slice(1).toLowerCase();
                                
                                return (
                                  <div
                                    key={submission.id}
                                    className="rounded-lg p-3 bg-[var(--surm-paper)] border border-[var(--surm-green)]/10 flex items-center justify-between"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-semibold font-sans text-[var(--surm-text-dark)]">
                                          {submission.users.name}
                                        </p>
                                        <span className={`text-xs font-sans px-2 py-0.5 rounded-full ${statusColor}`}>
                                          {statusLabel}
                                        </span>
                                      </div>
                                      <p className="text-xs font-sans text-[var(--surm-text-dark)]/60">
                                        {submission.users.email} • Submitted: {new Date(submission.createdAt).toLocaleString()}
                                      </p>
                                    </div>
                                    {submission.fileUrl && submission.fileUrl !== "no-file-uploaded" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(submission.fileUrl, "_blank")}
                                        className="rounded-full ml-2"
                                      >
                                        <FileText className="w-4 h-4 mr-2" />
                                        View File
                                      </Button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {submissionsForAssignment.length === 0 && (
                          <p className="text-xs font-sans text-[var(--surm-text-dark)]/50 mt-2">
                            No submissions yet
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditAssignment(assignment)}
                          className="rounded-full"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="rounded-full bg-red-600 hover:bg-red-700 text-white border-red-700">
                              <Trash2 className="w-4 h-4 text-white" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete &quot;{assignment.title}&quot;. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteAssignment(assignment.id)} className="bg-red-600 hover:bg-red-700 text-white">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="grades" className="space-y-6">
          {/* Grade Management - Beige Panel */}
          <section className="rounded-2xl bg-[var(--surm-beige)] p-8">
            <h2 className="text-2xl font-serif font-semibold text-[var(--surm-text-dark)] mb-2">
              Grade Management
            </h2>
            <p className="text-sm text-[var(--surm-text-dark)]/80 mb-6 font-sans">
              Assign grades to students for their assignments
            </p>
            
            {/* Level, Subject, and Student Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Label htmlFor="grades-level-filter" className="text-sm font-semibold text-[var(--surm-text-dark)]">
                  Level:
                </Label>
                <Select value={gradesLevelFilter} onValueChange={(value) => {
                  setGradesLevelFilter(value as Level | "all");
                  setGradeStudentFilter("all"); // Reset student filter when level changes
                }}>
                  <SelectTrigger id="grades-level-filter" className="w-48">
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
              <div className="flex items-center gap-2">
                <Label htmlFor="grades-subject-filter" className="text-sm font-semibold text-[var(--surm-text-dark)]">
                  Subject:
                </Label>
                <Select value={gradesSubjectFilter} onValueChange={(value) => setGradesSubjectFilter(value as Subject | "all")}>
                  <SelectTrigger id="grades-subject-filter" className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {SUBJECTS.map((subject) => (
                      <SelectItem key={subject.value} value={subject.value}>
                        {subject.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="grades-student-filter" className="text-sm font-semibold text-[var(--surm-text-dark)]">
                  Student:
                </Label>
                <Select value={gradeStudentFilter} onValueChange={setGradeStudentFilter} disabled={gradesLevelFilter === "all"}>
                  <SelectTrigger id="grades-student-filter" className="w-64">
                    <SelectValue placeholder={gradesLevelFilter === "all" ? "Select level first" : "All Students"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    {filteredStudentsForGrades.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={() => setGradeDialog(true)}
              className="rounded-full bg-[var(--surm-accent)] text-white hover:bg-[#35803F] mb-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Grade
            </Button>

            {filteredGrades.length === 0 ? (
              <div className="rounded-xl p-12 bg-white border border-[var(--surm-green)]/20 text-center">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 text-[var(--surm-text-dark)]/40" />
                <p className="text-lg font-semibold text-[var(--surm-text-dark)] mb-2">No grades yet</p>
                <p className="text-sm text-[var(--surm-text-dark)]/60">Grades will appear here once you assign them to students</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGrades.map((grade) => {
                  return (
                    <section
                      key={grade.id}
                      className="rounded-xl p-6 flex flex-col md:flex-row gap-4 items-start bg-white border border-[var(--surm-green)]/20 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <p className="font-semibold font-sans mb-1 text-[var(--surm-text-dark)]">
                          {grade.users.name}
                        </p>
                        <p className="text-sm mb-3 font-sans text-[var(--surm-text-dark)]/70">
                          {grade.assignments.title}
                        </p>
                        <p className="text-2xl font-bold font-serif mt-2 text-[var(--surm-accent)]">
                          {grade.score} / {grade.maxScore}
                        </p>
                        {grade.feedback && (
                          <p className="text-sm mt-2 font-sans text-[var(--surm-text-dark)]/60">
                            {grade.feedback}
                          </p>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6">
          {/* Form Submissions - Beige Panel */}
          <section className="rounded-2xl bg-[var(--surm-beige)] p-8">
            <h2 className="text-2xl font-serif font-semibold text-[var(--surm-text-dark)] mb-2">
              Student Form Submissions
            </h2>
            <p className="text-sm text-[var(--surm-text-dark)]/80 mb-6 font-sans">
              View and manage student form submissions (Medical Certificates and Early Dismissal Forms)
            </p>
            
            {/* Level Filter */}
            <div className="flex items-center gap-4 mb-6">
              <Label htmlFor="forms-level-filter" className="text-sm font-semibold text-[var(--surm-text-dark)]">
                Filter by Level:
              </Label>
              <Select value={formsLevelFilter} onValueChange={(value) => setFormsLevelFilter(value as Level | "all")}>
                <SelectTrigger id="forms-level-filter" className="w-48">
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

            {filteredFormSubmissions.length === 0 ? (
              <div className="rounded-xl p-12 bg-white border border-[var(--surm-green)]/20 text-center">
                <FileCheck className="w-12 h-12 mx-auto mb-4 text-[var(--surm-text-dark)]/40" />
                <p className="text-lg font-semibold text-[var(--surm-text-dark)] mb-2">No form submissions yet</p>
                <p className="text-sm text-[var(--surm-text-dark)]/60">Form submissions from students will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFormSubmissions.map((submission) => {
                  const submissionTypeLabel = submission.type === SubmissionType.MEDICAL_CERT 
                    ? "Medical Certificate" 
                    : "Early Dismissal Form";
                  
                  const statusLabel = submission.status.charAt(0) + submission.status.slice(1).toLowerCase();
                  
                  const getStatusClass = () => {
                    if (submission.status === "APPROVED") {
                      return "text-green-600 bg-green-50";
                    } else if (submission.status === "REJECTED") {
                      return "text-red-600 bg-red-50";
                    } else {
                      return "text-yellow-600 bg-yellow-50";
                    }
                  };
                  
                  const metadata = submission.metadata as any;
                  
                  return (
                    <section
                      key={submission.id}
                      className="rounded-xl p-6 flex flex-col md:flex-row gap-4 items-start bg-white border border-[var(--surm-green)]/20 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold font-sans text-[var(--surm-text-dark)]">
                            {submission.users.name}
                          </p>
                          <span className={`text-xs font-sans px-2 py-1 rounded-full ${getStatusClass()}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-sm mb-2 font-sans text-[var(--surm-text-dark)]/70">
                          <span className="font-medium">Type:</span> {submissionTypeLabel}
                        </p>
                        {submission.users.level && (
                          <p className="text-sm mb-2 font-sans text-[var(--surm-text-dark)]/70">
                            <span className="font-medium">Level:</span> {LEVELS.find((l) => l.value === submission.users.level)?.label || submission.users.level}
                          </p>
                        )}
                        <p className="text-sm mb-2 font-sans text-[var(--surm-text-dark)]/70">
                          <span className="font-medium">Email:</span> {submission.users.email}
                        </p>
                        {metadata && (
                          <div className="mt-3 p-3 bg-[var(--surm-paper)] rounded-lg">
                            <p className="text-xs font-semibold font-sans text-[var(--surm-text-dark)]/80 mb-1">Form Details:</p>
                            {submission.type === SubmissionType.MEDICAL_CERT && (
                              <div className="text-xs font-sans text-[var(--surm-text-dark)]/70 space-y-1">
                                {metadata.fullName && <p><span className="font-medium">Name:</span> {metadata.fullName}</p>}
                                {metadata.class && <p><span className="font-medium">Class:</span> {metadata.class}</p>}
                                {metadata.date && <p><span className="font-medium">Date:</span> {metadata.date}</p>}
                                {metadata.reason && <p><span className="font-medium">Reason:</span> {metadata.reason}</p>}
                              </div>
                            )}
                            {submission.type === SubmissionType.EARLY_DISMISSAL && (
                              <div className="text-xs font-sans text-[var(--surm-text-dark)]/70 space-y-1">
                                {metadata.fullName && <p><span className="font-medium">Name:</span> {metadata.fullName}</p>}
                                {metadata.class && <p><span className="font-medium">Class:</span> {metadata.class}</p>}
                                {metadata.day && metadata.month && metadata.year && (
                                  <p><span className="font-medium">Date:</span> {metadata.day}/{metadata.month}/{metadata.year}</p>
                                )}
                                {metadata.time && <p><span className="font-medium">Time:</span> {metadata.time} {metadata.ampm || ""}</p>}
                                {metadata.reason && <p><span className="font-medium">Reason:</span> {metadata.reason}</p>}
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-xs mt-3 font-sans text-[var(--surm-text-dark)]/60">
                          Submitted: {new Date(submission.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {submission.fileUrl && submission.fileUrl !== "no-file-uploaded" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(submission.fileUrl, "_blank")}
                            className="rounded-full"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View File
                          </Button>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </section>
        </TabsContent>
      </Tabs>

      {/* Edit Material Dialog */}
      <Dialog open={!!editMaterial} onOpenChange={(open) => !open && setEditMaterial(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Learning Material</DialogTitle>
            <DialogDescription>Update the material information</DialogDescription>
          </DialogHeader>
          {editMaterial && (
            <form onSubmit={handleUpdateMaterial} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-mat-level">Level *</Label>
                  <Select 
                    value={editMaterial.level} 
                    onValueChange={(value) => setEditMaterial({ ...editMaterial, level: value as Level })} 
                    required
                  >
                    <SelectTrigger id="edit-mat-level">
                      <SelectValue />
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
                <div className="space-y-2">
                  <Label htmlFor="edit-mat-subject">Subject *</Label>
                  <Select 
                    value={editMaterial.subject} 
                    onValueChange={(value) => setEditMaterial({ ...editMaterial, subject: value as Subject })} 
                    required
                  >
                    <SelectTrigger id="edit-mat-subject">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((subject) => (
                        <SelectItem key={subject.value} value={subject.value}>
                          {subject.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-mat-title">Title *</Label>
                <Input
                  id="edit-mat-title"
                  name="title"
                  defaultValue={editMaterial.title}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-mat-description">Description *</Label>
                <Textarea
                  id="edit-mat-description"
                  name="description"
                  defaultValue={editMaterial.description}
                  rows={4}
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-mat-video">Video URL</Label>
                  <Input
                    id="edit-mat-video"
                    name="videoUrl"
                    type="url"
                    defaultValue={editMaterial.videoUrl || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-mat-file">File URL</Label>
                  <Input
                    id="edit-mat-file"
                    name="fileUrl"
                    type="url"
                    defaultValue={editMaterial.fileUrl || ""}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditMaterial(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={!!editAssignment} onOpenChange={(open) => !open && setEditAssignment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>Update the assignment information</DialogDescription>
          </DialogHeader>
          {editAssignment && (
            <form onSubmit={handleUpdateAssignment} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-assign-level">Level *</Label>
                  <Select 
                    value={editAssignment.level} 
                    onValueChange={(value) => setEditAssignment({ ...editAssignment, level: value as Level })} 
                    required
                  >
                    <SelectTrigger id="edit-assign-level">
                      <SelectValue />
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
                <div className="space-y-2">
                  <Label htmlFor="edit-assign-subject">Subject *</Label>
                  <Select 
                    value={editAssignment.subject} 
                    onValueChange={(value) => setEditAssignment({ ...editAssignment, subject: value as Subject })} 
                    required
                  >
                    <SelectTrigger id="edit-assign-subject">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((subject) => (
                        <SelectItem key={subject.value} value={subject.value}>
                          {subject.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-assign-title">Title *</Label>
                <Input
                  id="edit-assign-title"
                  name="title"
                  defaultValue={editAssignment.title}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-assign-description">Description *</Label>
                <Textarea
                  id="edit-assign-description"
                  name="description"
                  defaultValue={editAssignment.description}
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-assign-due">Due Date *</Label>
                <Input
                  id="edit-assign-due"
                  name="dueDate"
                  type="date"
                  defaultValue={new Date(editAssignment.dueDate).toISOString().split("T")[0]}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditAssignment(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Grade Dialog */}
      <Dialog open={gradeDialog} onOpenChange={setGradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Grade</DialogTitle>
            <DialogDescription>Assign a grade to a student for an assignment</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitGrade} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grade-student">Student *</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent} required>
                <SelectTrigger id="grade-student">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({LEVELS.find((l) => l.value === student.level)?.label})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade-level-filter-dialog">Filter by Level (optional)</Label>
              <Select 
                value={gradesLevelFilter} 
                onValueChange={(value) => {
                  setGradesLevelFilter(value as Level | "all");
                  // Reset student selection when level changes
                  if (selectedStudent) {
                    const student = students.find(s => s.id === selectedStudent);
                    if (student && value !== "all" && student.level !== value) {
                      setSelectedStudent("");
                    }
                  }
                }}
              >
                <SelectTrigger id="grade-level-filter-dialog">
                  <SelectValue placeholder="All Levels" />
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
            <div className="space-y-2">
              <Label htmlFor="grade-assignment">Assignment *</Label>
              <Select value={selectedAssignment} onValueChange={setSelectedAssignment} required>
                <SelectTrigger id="grade-assignment">
                  <SelectValue placeholder="Select assignment" />
                </SelectTrigger>
                <SelectContent>
                  {assignments.map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id}>
                      {assignment.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade-score">Score *</Label>
                <Input
                  id="grade-score"
                  name="score"
                  type="number"
                  step="0.1"
                  min="0"
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade-max">Max Score</Label>
                <Input
                  id="grade-max"
                  name="maxScore"
                  type="number"
                  value={gradeMaxScore}
                  onChange={(e) => setGradeMaxScore(e.target.value)}
                  min="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade-feedback">Feedback</Label>
              <Textarea
                id="grade-feedback"
                name="feedback"
                rows={3}
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Optional feedback for the student..."
              />
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setGradeDialog(false);
                  setSelectedStudent("");
                  setSelectedAssignment("");
                  setGradeScore("");
                  setGradeMaxScore("100");
                  setGradeFeedback("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Submit Grade</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

