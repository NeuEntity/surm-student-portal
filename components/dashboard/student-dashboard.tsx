"use client";

import { useState, useRef } from "react";
import { Level, Subject } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, FileText, Upload, Calendar, Video, File, AlertCircle, GraduationCap, Plus, Play, ExternalLink, Maximize2, X } from "lucide-react";
import { format } from "date-fns";
import { LogoutButton } from "@/components/logout-button";
import { validateICNumber, validateRequiredText, validateDateParts } from "@/lib/validation";

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
  subject: Subject;
  videoUrl?: string | null;
  fileUrl?: string | null;
  attachments?: MaterialAttachment[] | null;
  createdAt: Date;
};

type Assignment = {
  id: string;
  title: string;
  description: string;
  subject: Subject;
  dueDate: Date;
  createdAt: Date;
};

type Submission = {
  id: string;
  type: string;
  fileUrl: string;
  assignmentId?: string | null;
  status?: string;
  createdAt: Date;
};

type Grade = {
  id: string;
  score: number;
  maxScore: number;
  feedback: string | null;
  assignments: {
    title: string;
    subject: Subject;
  };
  createdAt: Date;
};

interface StudentDashboardProps {
  level: Level;
  userName: string;
  materials: Material[];
  assignments: Assignment[];
  submissions: Submission[];
  grades: Grade[];
  userId: string;
}

const SUBJECTS = [
  { value: "AKIDAH", label: "Akidah" },
  { value: "AKHLAK", label: "Akhlak" },
  { value: "FIQH", label: "Fiqh" },
  { value: "FARAIDH", label: "Faraidh" },
  { value: "SIRAH", label: "Sirah" },
  { value: "HADIS", label: "Hadis" },
  { value: "MUSTOLAH_HADIS", label: "Mustolah Hadis" },
  { value: "ENGLISH", label: "English" },
  { value: "MALAY", label: "Malay" },
  { value: "ARABIC", label: "Arabic" },
  { value: "MATHS", label: "Maths" },
  { value: "IRK", label: "IRK" },
];

const VIDEO_FILE_EXTENSIONS = ["mp4", "mov", "m4v", "webm", "mkv", "avi"];

const getFileExtension = (url?: string | null) => {
  if (!url) return "";
  const cleanUrl = url.split("?")[0]?.split("#")[0] ?? "";
  const parts = cleanUrl.split(".");
  return parts.length > 1 ? (parts.pop() || "").toLowerCase() : "";
};

const buildYouTubeEmbedUrl = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : url;
};

const buildVimeoEmbedUrl = (url: string) => {
  const regExp = /vimeo.com\/(\d+)/;
  const match = url.match(regExp);
  return match ? `https://player.vimeo.com/video/${match[1]}` : url;
};

export default function StudentDashboard({
  level,
  userName,
  materials,
  assignments,
  submissions,
  grades,
  userId,
}: StudentDashboardProps) {
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadingAssignmentId, setUploadingAssignmentId] = useState<string | null>(null);
  const [assignmentErrors, setAssignmentErrors] = useState<Record<string, string>>({});
  
  // Medical Certificate form state
  const [medicalForm, setMedicalForm] = useState({
    fullName: userName,
    class: level.replace("SECONDARY_", "Secondary "),
    date: "",
    reason: "",
    file: null as File | null,
  });
  
  // Early Dismissal form state
  const [dismissalForm, setDismissalForm] = useState({
    fullName: userName,
    class: level.replace("SECONDARY_", "Secondary "),
    parentName: "",
    icNumber: "",
    day: "",
    month: "",
    year: "",
    time: "",
    ampm: "AM",
    reason: "",
    transport: "",
    file: null as File | null,
  });
  const [dismissalErrors, setDismissalErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const [hasSignature, setHasSignature] = useState(false);
  
  const [uploadingFormType, setUploadingFormType] = useState<"MEDICAL_CERT" | "EARLY_DISMISSAL" | null>(null);
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<string | null>(null);

  // Filter form submissions by current year
  const currentYear = new Date().getFullYear();
  const formSubmissions = (submissions || []).filter(
    (s) => {
      const submissionYear = new Date(s.createdAt).getFullYear();
      return (s.type === "MEDICAL_CERT" || s.type === "EARLY_DISMISSAL") && submissionYear === currentYear;
    }
  );
  const canUploadMore = formSubmissions.length < 5;

  const filteredMaterials =
    subjectFilter === "all"
      ? materials
      : materials.filter((m) => m.subject === subjectFilter);

  const filteredAssignments =
    subjectFilter === "all"
      ? assignments
      : assignments.filter((a) => a.subject === subjectFilter);

  const filteredGrades =
    subjectFilter === "all"
      ? grades
      : grades.filter((g) => g.assignments.subject === subjectFilter);

  async function handleFileUpload(
    event: React.FormEvent<HTMLFormElement>,
    type: "MEDICAL_CERT" | "EARLY_DISMISSAL" | "ASSIGNMENT",
    assignmentId?: string,
    metadata?: any
  ) {
    event.preventDefault();
    setUploading(true);
    setUploadMessage("");
    if (assignmentId) {
      setUploadingAssignmentId(assignmentId);
      setAssignmentErrors((prev) => ({ ...prev, [assignmentId]: "" }));
    }
    if (type === "MEDICAL_CERT" || type === "EARLY_DISMISSAL") {
      setUploadingFormType(type);
    }

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file") as File;

    if (!file && !assignmentId) {
      const errorMsg = "Please select a file";
      setUploadMessage(errorMsg);
      if (assignmentId) {
        setAssignmentErrors((prev) => ({ ...prev, [assignmentId]: errorMsg }));
      }
      setUploading(false);
      if (assignmentId) {
        setUploadingAssignmentId(null);
      }
      if (type === "MEDICAL_CERT" || type === "EARLY_DISMISSAL") {
        setUploadingFormType(null);
      }
      return;
    }

    try {
      // Upload file if provided
      let fileUrl = "";
      if (file) {
        const MAX_FILE_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
          const errorMsg = "File size exceeds 5MB limit";
          setUploadMessage(errorMsg);
          if (assignmentId) {
            setAssignmentErrors((prev) => ({ ...prev, [assignmentId]: errorMsg }));
          }
          setUploading(false);
          setUploadingAssignmentId(null);
          setUploadingFormType(null);
          return;
        }
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const uploadUrl = "/api/upload";
        const xhr = new XMLHttpRequest();
        const uploadPromise = new Promise<string>((resolve, reject) => {
          xhr.open("POST", uploadUrl, true);
          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) {
              const percent = Math.round((evt.loaded / evt.total) * 100);
              setUploadProgress(percent);
            }
          };
          xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const resp = JSON.parse(xhr.responseText);
                  resolve(resp.fileUrl);
                } catch (e) {
                  reject(new Error("Invalid upload response"));
                }
              } else {
                try {
                  const err = JSON.parse(xhr.responseText);
                  reject(new Error(err.error || "File upload failed"));
                } catch {
                  reject(new Error("File upload failed"));
                }
              }
            }
          };
          xhr.onerror = () => reject(new Error("Network error during upload"));
          const form = new FormData();
          form.append("file", file);
          xhr.send(form);
        });
        fileUrl = await uploadPromise;
      }

      // Create submission
      const submissionRes = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type, 
          fileUrl, 
          assignmentId: assignmentId || null,
          metadata: metadata || null
        }),
      });

      if (!submissionRes.ok) {
        const error = await submissionRes.json();
        throw new Error(error.error || "Submission failed");
      }

      const successMsg = assignmentId 
        ? "Assignment submitted successfully!" 
        : type === "MEDICAL_CERT"
        ? "Medical certificate submitted successfully!"
        : "Early dismissal form submitted successfully!";
      setUploadMessage(successMsg);
      if (assignmentId) {
        setAssignmentErrors((prev) => ({ ...prev, [assignmentId]: successMsg }));
      }
      
      // Reset forms
      if (type === "MEDICAL_CERT") {
        setMedicalForm({
          fullName: userName,
          class: level.replace("SECONDARY_", "Secondary "),
          date: "",
          reason: "",
          file: null,
        });
      } else if (type === "EARLY_DISMISSAL") {
        setDismissalForm({
          fullName: userName,
          class: level.replace("SECONDARY_", "Secondary "),
          parentName: "",
          icNumber: "",
          day: "",
          month: "",
          year: "",
          time: "",
          ampm: "AM",
          reason: "",
          transport: "",
          file: null,
        });
      }
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      const errorMsg = `Error: ${error.message}`;
      setUploadMessage(errorMsg);
      if (assignmentId) {
        setAssignmentErrors((prev) => ({ ...prev, [assignmentId]: errorMsg }));
      }
    } finally {
      setUploading(false);
      if (assignmentId) {
        setUploadingAssignmentId(null);
      }
      if (type === "MEDICAL_CERT" || type === "EARLY_DISMISSAL") {
        setUploadingFormType(null);
      }
    }
  }
  
  async function handleMedicalCertSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    if (!medicalForm.fullName || !medicalForm.class || !medicalForm.date || !medicalForm.reason || !medicalForm.file) {
      setUploadMessage("Please fill in all required fields");
      return;
    }
    
    setUploading(true);
    setUploadMessage("");
    setUploadingFormType("MEDICAL_CERT");
    
    try {
      const file = medicalForm.file!;
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size exceeds 5MB limit");
      }
      const uploadUrl = "/api/upload";
      const xhr = new XMLHttpRequest();
      const fileUrl = await new Promise<string>((resolve, reject) => {
        xhr.open("POST", uploadUrl, true);
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const percent = Math.round((evt.loaded / evt.total) * 100);
            setUploadProgress(percent);
          }
        };
        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const resp = JSON.parse(xhr.responseText);
                resolve(resp.fileUrl);
              } catch (e) {
                reject(new Error("Invalid upload response"));
              }
            } else {
              try {
                const err = JSON.parse(xhr.responseText);
                reject(new Error(err.error || "File upload failed"));
              } catch {
                reject(new Error("File upload failed"));
              }
            }
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        const form = new FormData();
        form.append("file", file);
        xhr.send(form);
      });

      const metadata = {
        fullName: medicalForm.fullName,
        class: medicalForm.class,
        date: medicalForm.date,
        reason: medicalForm.reason,
      };

      const submissionRes = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "MEDICAL_CERT", 
          fileUrl, 
          metadata
        }),
      });

      if (!submissionRes.ok) {
        const error = await submissionRes.json();
        throw new Error(error.error || "Submission failed");
      }

      setUploadMessage("Medical certificate submitted successfully!");
      
      // Reset form
      setMedicalForm({
        fullName: userName,
        class: level.replace("SECONDARY_", "Secondary "),
        date: "",
        reason: "",
        file: null,
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      setUploadMessage(`Error: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadingFormType(null);
    }
  }
  
  async function handleEarlyDismissalSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    const fieldErrors: Record<string, string> = {};
    if (!validateRequiredText(dismissalForm.parentName)) fieldErrors.parentName = "Parent name is required";
    if (!validateRequiredText(dismissalForm.fullName)) fieldErrors.fullName = "Student name is required";
    if (!validateRequiredText(dismissalForm.class)) fieldErrors.class = "Class is required";
    const dateValid = validateDateParts(dismissalForm.day, dismissalForm.month, dismissalForm.year);
    if (!dateValid) fieldErrors.date = "Invalid date";
    if (!validateRequiredText(dismissalForm.reason)) fieldErrors.reason = "Reason is required";
    if (!validateICNumber(dismissalForm.icNumber)) fieldErrors.icNumber = "Invalid IC number format";
    if (Object.keys(fieldErrors).length > 0) {
      setDismissalErrors(fieldErrors);
      setUploadMessage("Please fill in all required fields");
      return;
    }
    
    setUploading(true);
    setUploadMessage("");
    setUploadingFormType("EARLY_DISMISSAL");
    
    try {
      let fileUrl = "";
      
      if (dismissalForm.file) {
        const MAX_FILE_SIZE = 5 * 1024 * 1024;
        if (dismissalForm.file.size > MAX_FILE_SIZE) {
          throw new Error("File size exceeds 5MB limit");
        }
        const uploadFormData = new FormData();
        uploadFormData.append("file", dismissalForm.file);

        const xhrFile = new XMLHttpRequest();
        fileUrl = await new Promise<string>((resolve, reject) => {
          xhrFile.open("POST", "/api/upload", true);
          xhrFile.upload.onprogress = (evt) => {
            if (evt.lengthComputable) {
              const percent = Math.round((evt.loaded / evt.total) * 100);
              setUploadProgress(percent);
            }
          };
          xhrFile.onreadystatechange = () => {
            if (xhrFile.readyState === XMLHttpRequest.DONE) {
              if (xhrFile.status >= 200 && xhrFile.status < 300) {
                try {
                  const resp = JSON.parse(xhrFile.responseText);
                  resolve(resp.fileUrl);
                } catch {
                  reject(new Error("Invalid upload response"));
                }
              } else {
                try {
                  const err = JSON.parse(xhrFile.responseText);
                  reject(new Error(err.error || "File upload failed"));
                } catch {
                  reject(new Error("File upload failed"));
                }
              }
            }
          };
          xhrFile.onerror = () => reject(new Error("Network error during upload"));
          xhrFile.send(uploadFormData);
        });
      }
      
      let signatureUrl = "";
      if (signatureCanvasRef.current && hasSignature) {
        const blob: Blob = await new Promise((resolve) => {
          signatureCanvasRef.current!.toBlob((b) => resolve(b as Blob), "image/png");
        });
        const form = new FormData();
        const sigBlob = new Blob([blob], { type: "image/png" });
        form.append("file", sigBlob, "signature.png");
        const xhrSig = new XMLHttpRequest();
        signatureUrl = await new Promise<string>((resolve, reject) => {
          xhrSig.open("POST", "/api/upload", true);
          xhrSig.onreadystatechange = () => {
            if (xhrSig.readyState === XMLHttpRequest.DONE) {
              if (xhrSig.status >= 200 && xhrSig.status < 300) {
                try {
                  const resp = JSON.parse(xhrSig.responseText);
                  resolve(resp.fileUrl);
                } catch {
                  reject(new Error("Invalid upload response"));
                }
              } else {
                try {
                  const err = JSON.parse(xhrSig.responseText);
                  reject(new Error(err.error || "Signature upload failed"));
                } catch {
                  reject(new Error("Signature upload failed"));
                }
              }
            }
          };
          xhrSig.onerror = () => reject(new Error("Network error during upload"));
          xhrSig.send(form);
        });
      }
      
      const dateTime = `${dismissalForm.year}-${dismissalForm.month.padStart(2, "0")}-${dismissalForm.day.padStart(2, "0")} ${dismissalForm.time} ${dismissalForm.ampm}`;
      
      const metadata = {
        fullName: dismissalForm.fullName,
        class: dismissalForm.class,
        parentName: dismissalForm.parentName,
        icNumber: dismissalForm.icNumber,
        date: dismissalForm.day,
        month: dismissalForm.month,
        year: dismissalForm.year,
        time: dismissalForm.time,
        ampm: dismissalForm.ampm,
        dateTime: dateTime,
        reason: dismissalForm.reason,
        transport: dismissalForm.transport || "",
        signatureUrl: signatureUrl || "",
      };
      
      const submissionRes = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "EARLY_DISMISSAL", 
          fileUrl: fileUrl || undefined, 
          metadata
        }),
      });

      if (!submissionRes.ok) {
        const error = await submissionRes.json();
        throw new Error(error.error || "Submission failed");
      }

      const submissionData = await submissionRes.json();
      const pdfRes = await fetch("/api/early-dismissal/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submissionData.id }),
      });
      let pdfMessage = "";
      if (pdfRes.ok) {
        const pdfData = await pdfRes.json();
        pdfMessage = pdfData?.pdfUrl ? ` PDF generated: ${pdfData.pdfUrl}` : "";
      }

      setUploadMessage(`Early dismissal form submitted successfully!${pdfMessage}`);
      
      // Reset form
      setDismissalForm({
        fullName: userName,
        class: level.replace("SECONDARY_", "Secondary "),
        parentName: "",
        icNumber: "",
        day: "",
        month: "",
        year: "",
        time: "",
        ampm: "AM",
        reason: "",
        transport: "",
        file: null,
      });
      clearSignature();
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      setUploadMessage(`Error: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadingFormType(null);
    }
  }

  async function handleAssignmentUpload(
    event: React.FormEvent<HTMLFormElement>,
    assignmentId: string
  ) {
    await handleFileUpload(event, "ASSIGNMENT", assignmentId);
  }
  
  function clearSignature() {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }

  const levelName = level.replace("_", " ").replace("SECONDARY", "Secondary");

  return (
    <div className="min-h-screen bg-[var(--surm-paper)]">
      {/* Hero Banner Section */}
      <div className="relative w-full h-48 sm:h-56 md:h-64 bg-[var(--surm-green)] rounded-b-3xl overflow-hidden mb-6 sm:mb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--surm-green)]/90 to-[var(--surm-green-soft)]/80"></div>
        <div className="relative container mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12 h-full flex flex-col justify-center">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-semibold text-white mb-1 sm:mb-2 truncate">Welcome, {userName}</h1>
              <p className="text-base sm:text-lg text-white/90 font-sans">{levelName}</p>
            </div>
            <div className="flex-shrink-0">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 -mt-2 sm:-mt-4">
        {/* Filter Section - Beige Panel */}
        <section className="rounded-2xl bg-[var(--surm-beige)] p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-serif font-semibold text-[var(--surm-text-dark)] mb-1">Filter by Subject</h2>
              <p className="text-xs sm:text-sm text-[var(--surm-text-dark)]/80 font-sans">Select a subject to view specific materials and assignments</p>
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger id="subject-filter" className="w-full md:w-64 bg-white">
                <SelectValue placeholder="All Subjects" />
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
        </section>

        <Tabs defaultValue="materials" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-2xl bg-white rounded-full p-1 gap-1">
            <TabsTrigger value="materials" className="rounded-full font-sans text-xs sm:text-sm px-2 sm:px-4">
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Materials</span>
              <span className="sm:hidden">Materials</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="rounded-full font-sans text-xs sm:text-sm px-2 sm:px-4">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Assignments</span>
              <span className="sm:hidden">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="grades" className="rounded-full font-sans text-xs sm:text-sm px-2 sm:px-4">
              <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Grades
            </TabsTrigger>
            <TabsTrigger value="uploads" className="rounded-full font-sans text-xs sm:text-sm px-2 sm:px-4">
              <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Uploads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="space-y-4 sm:space-y-6">
            {filteredMaterials.length === 0 ? (
              <section className="rounded-2xl bg-white p-6 sm:p-8 text-center">
                <p className="text-sm sm:text-base text-[var(--surm-text-dark)]/70 font-sans">
                  No learning materials available for this selection.
                </p>
              </section>
            ) : (
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                {filteredMaterials.map((material, index) => {
                  const isBeige = index % 2 === 0;
                  const isExpanded = expandedMaterial === material.id;
                  const isPreviewing = previewMaterial === material.id;
                  
                  const attachments = Array.isArray(material.attachments)
                    ? (material.attachments as MaterialAttachment[])
                    : [];
                  const primaryAttachment = attachments[0];
                  const previewFileUrl = primaryAttachment?.url || material.fileUrl || null;
                  const previewFileType = primaryAttachment?.type || null;
                  const previewExtension = getFileExtension(previewFileUrl);
                  const isPdfFile = !!previewFileUrl && (previewFileType === "application/pdf" || previewExtension === "pdf");
                  const isVideoAttachment =
                    !!previewFileUrl &&
                    !material.videoUrl &&
                    ((previewFileType && previewFileType.startsWith("video/")) ||
                      VIDEO_FILE_EXTENSIONS.includes(previewExtension));
                  const videoSource = material.videoUrl || (isVideoAttachment ? previewFileUrl : null);
                  const documentPreviewUrl = !videoSource ? previewFileUrl : null;
                  const documentPreviewIsPDF = !!documentPreviewUrl && isPdfFile;
                  const documentLinkUrl = previewFileUrl;
                  const documentLinkIsPDF = !!documentLinkUrl && isPdfFile;
                  const isYouTube = !!videoSource && videoSource.includes("youtu");
                  const isVimeo = !!videoSource && videoSource.includes("vimeo");

                  return (
                    <div key={material.id} className="relative">
                      <section
                        className={`rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl ${
                          isBeige
                            ? "bg-[var(--surm-beige)] border-2 border-[var(--surm-beige)]"
                            : "bg-[var(--surm-green-soft)] border-2 border-[var(--surm-green-soft)] text-white"
                        } ${isExpanded ? 'shadow-2xl' : ''}`}
                      >
                        {/* Preview Section */}
                        {(videoSource || documentPreviewUrl) && (
                          <div className={`relative w-full ${isExpanded ? 'h-64 sm:h-80' : 'h-48 sm:h-56'} bg-black/10 overflow-hidden`}>
                            {videoSource && (
                              <div className="relative w-full h-full">
                                {isYouTube ? (
                                  <iframe
                                    src={buildYouTubeEmbedUrl(videoSource) + '?rel=0&modestbranding=1'}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={material.title}
                                  />
                                ) : isVimeo ? (
                                  <iframe
                                    src={buildVimeoEmbedUrl(videoSource) + '?title=0&byline=0&portrait=0'}
                                    className="w-full h-full"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                    title={material.title}
                                  />
                                ) : (
                                  <video
                                    src={videoSource}
                                    className="w-full h-full object-cover"
                                    controls
                                    preload="metadata"
                                  />
                                )}
                                <div className="absolute top-2 right-2 flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setPreviewMaterial(isPreviewing ? null : material.id)}
                                    className="bg-white/90 hover:bg-white text-[var(--surm-text-dark)] rounded-full p-2 h-8 w-8"
                                  >
                                    {isPreviewing ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                  </Button>
                                </div>
                              </div>
                            )}
                            {!videoSource && documentPreviewUrl && (
                              <div className="relative w-full h-full">
                                {documentPreviewIsPDF ? (
                                  <iframe
                                    src={documentPreviewUrl}
                                    className="w-full h-full"
                                    title={material.title}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--surm-green-soft)] to-[var(--surm-beige)]">
                                    <File className="w-16 h-16 text-white/50" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                <div className="absolute top-2 right-2 flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setPreviewMaterial(isPreviewing ? null : material.id)}
                                    className="bg-white/90 hover:bg-white text-[var(--surm-text-dark)] rounded-full p-2 h-8 w-8"
                                  >
                                    {isPreviewing ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                  </Button>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4">
                                  <a
                                    href={documentPreviewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-sm ${
                                      isBeige
                                        ? "bg-white/90 text-[var(--surm-text-dark)] hover:bg-white"
                                        : "bg-white/90 text-[var(--surm-green)] hover:bg-white"
                                    }`}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Open Document
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Content Section */}
                        <div className="p-4 sm:p-6">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <h3 className={`text-lg sm:text-xl font-serif font-semibold mb-2 ${
                                isBeige ? "text-[var(--surm-text-dark)]" : "text-white"
                              }`}>
                                {material.title}
                              </h3>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  isBeige
                                    ? "bg-[var(--surm-accent)]/20 text-[var(--surm-accent)]"
                                    : "bg-white/20 text-white"
                                }`}>
                                  {SUBJECTS.find((s) => s.value === material.subject)?.label}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <p className={`text-xs sm:text-sm mb-4 font-sans line-clamp-3 ${
                            isBeige ? "text-[var(--surm-text-dark)]/70" : "text-white/80"
                          }`}>
                            {material.description}
                          </p>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex gap-2 flex-wrap">
                              {videoSource && (
                                <a
                                  href={videoSource}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all ${
                                    isBeige
                                      ? "bg-[var(--surm-accent)] text-white hover:bg-[#35803F]"
                                      : "bg-white text-[var(--surm-green)] hover:bg-[var(--surm-paper)]"
                                  }`}
                                >
                                  <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                                  Watch Video
                                </a>
                              )}
                              {documentLinkUrl && (
                                <a
                                  href={documentLinkUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all ${
                                    isBeige
                                      ? "bg-[var(--surm-accent)] text-white hover:bg-[#35803F]"
                                      : "bg-white text-[var(--surm-green)] hover:bg-[var(--surm-paper)]"
                                  }`}
                                >
                                  <File className="w-3 h-3 sm:w-4 sm:h-4" />
                                  {documentLinkIsPDF ? "View PDF" : "Open Document"}
                                </a>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExpandedMaterial(isExpanded ? null : material.id)}
                              className={`rounded-full ${isBeige ? 'text-[var(--surm-text-dark)]/70 hover:text-[var(--surm-text-dark)]' : 'text-white/70 hover:text-white'}`}
                            >
                              {isExpanded ? 'Show Less' : 'Read More'}
                            </Button>
                          </div>
                          
                          {attachments.length > 0 && (
                            <div
                              className={`mt-4 rounded-2xl border p-3 text-xs ${
                                isBeige
                                  ? "border-[var(--surm-green)]/10 bg-white/80 text-[var(--surm-text-dark)]"
                                  : "border-white/20 bg-white/10 text-white"
                              }`}
                            >
                              <p className="font-semibold">
                                Resources ({attachments.length}) • first file is used for the preview above
                              </p>
                              <div className="mt-2 space-y-1 max-h-28 overflow-y-auto">
                                {attachments.map((attachment, attachmentIndex) => (
                                  <div key={`${attachment.url}-${attachmentIndex}`} className="flex items-center justify-between gap-2">
                                    <span className="truncate pr-2">
                                      {attachmentIndex === 0 ? "Primary" : `Resource ${attachmentIndex + 1}`}
                                      {" · "}
                                      {attachment.name || "Untitled file"}
                                    </span>
                                    <a
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
                                        isBeige
                                          ? "bg-[var(--surm-accent)]/15 text-[var(--surm-accent)] hover:bg-[var(--surm-accent)]/25"
                                          : "bg-white/20 text-white hover:bg-white/30"
                                      }`}
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      Open
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Expanded Description */}
                          {isExpanded && (
                            <div className={`mt-4 pt-4 border-t ${
                              isBeige ? 'border-[var(--surm-text-dark)]/20' : 'border-white/20'
                            }`}>
                              <p className={`text-sm font-sans ${
                                isBeige ? "text-[var(--surm-text-dark)]/80" : "text-white/90"
                              }`}>
                                {material.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full Screen Preview Modal */}
            {previewMaterial && (() => {
              const material = filteredMaterials.find(m => m.id === previewMaterial);
              if (!material) return null;
              
              const attachments = Array.isArray(material.attachments)
                ? (material.attachments as MaterialAttachment[])
                : [];
              const primaryAttachment = attachments[0];
              const previewFileUrl = primaryAttachment?.url || material.fileUrl || null;
              const previewFileType = primaryAttachment?.type || null;
              const previewExtension = getFileExtension(previewFileUrl);
              const isPdfFile = !!previewFileUrl && (previewFileType === "application/pdf" || previewExtension === "pdf");
              const isVideoAttachment =
                !!previewFileUrl &&
                !material.videoUrl &&
                ((previewFileType && previewFileType.startsWith("video/")) ||
                  VIDEO_FILE_EXTENSIONS.includes(previewExtension));
              const videoSource = material.videoUrl || (isVideoAttachment ? previewFileUrl : null);
              const documentPreviewUrl = !videoSource ? previewFileUrl : null;
              const documentIsPDF = !!documentPreviewUrl && isPdfFile;
              const isYouTube = !!videoSource && videoSource.includes("youtu");
              const isVimeo = !!videoSource && videoSource.includes("vimeo");

              return (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setPreviewMaterial(null)}>
                  <div className="relative w-full max-w-6xl h-full max-h-[90vh] bg-white rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="absolute top-4 right-4 z-10">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPreviewMaterial(null)}
                        className="bg-white/90 hover:bg-white text-[var(--surm-text-dark)] rounded-full p-2 h-10 w-10"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                    <div className="w-full h-full">
                      {videoSource && (
                        isYouTube ? (
                          <iframe
                            src={buildYouTubeEmbedUrl(videoSource) + '?rel=0&modestbranding=1&autoplay=1'}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={material.title}
                          />
                        ) : isVimeo ? (
                          <iframe
                            src={buildVimeoEmbedUrl(videoSource) + '?title=0&byline=0&portrait=0&autoplay=1'}
                            className="w-full h-full"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            title={material.title}
                          />
                        ) : (
                          <video
                            src={videoSource}
                            className="w-full h-full object-contain"
                            controls
                            autoPlay
                          />
                        )
                      )}
                      {documentPreviewUrl && !videoSource && (
                        documentIsPDF ? (
                          <iframe
                            src={documentPreviewUrl}
                            className="w-full h-full"
                            title={material.title}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <div className="text-center">
                              <File className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                              <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                              <a
                                href={documentPreviewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-[var(--surm-accent)] text-white hover:bg-[#35803F]"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Open Document
                              </a>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4 sm:space-y-6">
            {filteredAssignments.length === 0 ? (
              <section className="rounded-2xl bg-white p-6 sm:p-8 text-center">
                <p className="text-sm sm:text-base text-[var(--surm-text-dark)]/70 font-sans">
                  No assignments available for this selection.
                </p>
              </section>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {filteredAssignments.map((assignment, index) => {
                  const isBeige = index % 2 === 0;
                  const assignmentSubmission = (submissions || []).find(
                    (s) => s.type === "ASSIGNMENT" && s.assignmentId === assignment.id
                  );
                  const isPastDue = new Date(assignment.dueDate) < new Date();
                  const isUploading = uploadingAssignmentId === assignment.id;
                  
                  return (
                    <section
                      key={assignment.id}
                      className={`rounded-2xl p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 transition-shadow hover:shadow-lg ${
                        isBeige
                          ? "bg-[var(--surm-beige)]"
                          : "bg-[var(--surm-green-soft)] text-white"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <h3 className={`text-lg sm:text-xl font-serif font-semibold mb-2 ${
                              isBeige ? "text-[var(--surm-text-dark)]" : "text-white"
                            }`}>
                              {assignment.title}
                            </h3>
                            <p className={`text-xs sm:text-sm mb-2 sm:mb-3 font-sans ${
                              isBeige ? "text-[var(--surm-text-dark)]/80" : "text-white/90"
                            }`}>
                              {SUBJECTS.find((s) => s.value === assignment.subject)?.label}
                            </p>
                            <p className={`text-xs sm:text-sm mb-3 sm:mb-4 font-sans description-text ${
                              isBeige ? "text-[var(--surm-text-dark)]/70" : "text-white/80"
                            }`}>
                              {assignment.description}
                            </p>
                            <div className={`flex items-center text-xs sm:text-sm font-sans mb-3 sm:mb-4 ${
                              isBeige ? "text-[var(--surm-text-dark)]/70" : "text-white/90"
                            }`}>
                              <Calendar className="w-4 h-4 mr-2" />
                              Due: {format(new Date(assignment.dueDate), "PPP")}
                              {isPastDue && (
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                                  isBeige 
                                    ? "bg-red-100 text-red-700" 
                                    : "bg-red-500/20 text-white"
                                }`}>
                                  Past Due
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Submission Status */}
                        {assignmentSubmission && (
                          <div className={`mb-4 rounded-lg p-4 ${
                            isBeige
                              ? "bg-white/80 border border-[var(--surm-green)]/20"
                              : "bg-white/10 border border-white/20"
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm font-semibold mb-1 font-sans ${
                                  isBeige ? "text-[var(--surm-text-dark)]" : "text-white"
                                }`}>
                                  Submission Status: 
                                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                                    assignmentSubmission.status === "APPROVED"
                                      ? isBeige
                                        ? "bg-[var(--surm-beige)]/50 text-[var(--surm-text-dark)]"
                                        : "bg-[var(--surm-green-soft)]/50 text-white"
                                      : assignmentSubmission.status === "REJECTED"
                                      ? isBeige
                                        ? "bg-red-100 text-red-700"
                                        : "bg-red-500/30 text-white"
                                      : isBeige
                                        ? "bg-[var(--surm-beige)]/50 text-[var(--surm-text-dark)] border border-[var(--surm-text-dark)]/20"
                                        : "bg-white/20 text-white border border-white/30"
                                  }`}>
                                    {assignmentSubmission.status || "PENDING"}
                                  </span>
                                </p>
                                <p className={`text-xs font-sans ${
                                  isBeige ? "text-[var(--surm-text-dark)]/70" : "text-white/80"
                                }`}>
                                  Submitted on {format(new Date(assignmentSubmission.createdAt), "PPP 'at' p")}
                                </p>
                                {assignmentSubmission.fileUrl && (
                                  <a
                                    href={assignmentSubmission.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center gap-2 mt-2 text-sm ${
                                      isBeige 
                                        ? "text-[var(--surm-accent)] hover:underline" 
                                        : "text-white hover:underline"
                                    }`}
                                  >
                                    <File className="w-4 h-4" />
                                    View Submitted File
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Upload Form */}
                        {!assignmentSubmission && (
                          <div className="mt-4">
                            {assignmentErrors[assignment.id] && (
                              <div className={`mb-3 p-3 rounded-lg ${
                                assignmentErrors[assignment.id].includes("successfully")
                                  ? isBeige
                                    ? "bg-[var(--surm-beige)]/30 border border-[var(--surm-beige)]"
                                    : "bg-[var(--surm-green-soft)]/30 border border-[var(--surm-green-soft)]/50"
                                  : isBeige
                                    ? "bg-red-50 border border-red-200"
                                    : "bg-red-500/20 border border-red-500/30"
                              }`}>
                                <p className={`text-sm font-sans ${
                                  assignmentErrors[assignment.id].includes("successfully")
                                    ? isBeige ? "text-[var(--surm-accent)]" : "text-white"
                                    : isBeige ? "text-red-700" : "text-white"
                                }`}>
                                  {assignmentErrors[assignment.id]}
                                </p>
                              </div>
                            )}
                            <form
                              onSubmit={(e) => handleAssignmentUpload(e, assignment.id)}
                              className={`p-4 rounded-lg ${
                                isBeige
                                  ? "bg-white/80 border border-[var(--surm-green)]/20"
                                  : "bg-white/10 border border-white/20"
                              }`}
                            >
                              <Label 
                                htmlFor={`assignment-file-${assignment.id}`} 
                                className={`text-sm font-semibold font-sans ${
                                  isBeige ? "text-[var(--surm-text-dark)]" : "text-white"
                                }`}
                              >
                                Submit Assignment
                              </Label>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
                              <Input
                                id={`assignment-file-${assignment.id}`}
                                name="file"
                                type="file"
                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                disabled={isUploading}
                                className={`flex-1 text-xs sm:text-sm ${
                                  isBeige ? "bg-white" : "bg-white"
                                }`}
                                required
                              />
                              <Button
                                type="submit"
                                disabled={isUploading}
                                className={`rounded-full font-sans text-xs sm:text-sm px-4 py-2 whitespace-nowrap ${
                                  isBeige
                                    ? "bg-[var(--surm-accent)] text-white hover:bg-[#35803F]"
                                    : "bg-white text-[var(--surm-green)] hover:bg-[var(--surm-paper)]"
                                }`}
                              >
                                {isUploading ? "Uploading..." : "Submit"}
                              </Button>
                            </div>
                            </form>
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="grades" className="space-y-4 sm:space-y-6">
            {filteredGrades.length === 0 ? (
              <section className="rounded-2xl bg-white p-6 sm:p-8 text-center">
                <p className="text-sm sm:text-base text-[var(--surm-text-dark)]/70 font-sans">
                  No grades available yet.
                </p>
              </section>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {filteredGrades.map((grade, index) => {
                  const percentage = (grade.score / grade.maxScore) * 100;
                  const isBeige = index % 2 === 0;
                  
                  return (
                    <section
                      key={grade.id}
                      className={`rounded-2xl p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-4 sm:gap-6 items-start transition-shadow hover:shadow-lg ${
                        isBeige
                          ? "bg-[var(--surm-beige)]"
                          : "bg-[var(--surm-green-soft)] text-white"
                      }`}
                    >
                      <div className="flex-1">
                        <h3 className={`text-lg sm:text-xl font-serif font-semibold mb-2 ${
                          isBeige ? "text-[var(--surm-text-dark)]" : "text-white"
                        }`}>
                          {grade.assignments.title}
                        </h3>
                        <p className={`text-xs sm:text-sm mb-3 sm:mb-4 font-sans ${
                          isBeige ? "text-[var(--surm-text-dark)]/80" : "text-white/90"
                        }`}>
                          {SUBJECTS.find((s) => s.value === grade.assignments.subject)?.label}
                        </p>
                        {grade.feedback && (
                          <div className={`mt-3 sm:mt-4 rounded-lg p-3 sm:p-4 ${
                            isBeige
                              ? "bg-white/80 border border-[var(--surm-green)]/20"
                              : "bg-white/10 border border-white/20"
                          }`}>
                            <p className={`text-xs sm:text-sm font-semibold mb-1 font-sans ${
                              isBeige ? "text-[var(--surm-text-dark)]" : "text-white"
                            }`}>
                              Teacher Feedback:
                            </p>
                            <p className={`text-xs sm:text-sm font-sans ${
                              isBeige ? "text-[var(--surm-text-dark)]/80" : "text-white/90"
                            }`}>
                              {grade.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="text-right mt-4 md:mt-0">
                        <p className={`text-3xl sm:text-4xl font-bold font-serif ${
                          isBeige ? "text-[var(--surm-accent)]" : "text-white"
                        }`}>
                          {grade.score}/{grade.maxScore}
                        </p>
                        <p className={`text-xs sm:text-sm font-sans mt-1 ${
                          isBeige ? "text-[var(--surm-text-dark)]/70" : "text-white/80"
                        }`}>
                          {percentage.toFixed(1)}%
                        </p>
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="uploads" className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-500">
            <Tabs defaultValue="medical" className="w-full space-y-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-serif font-semibold text-[var(--surm-text-dark)]">Submit Request</h2>
                  <p className="text-sm text-[var(--surm-text-dark)]/70 font-sans max-w-md mx-auto">
                    Select the form type below to proceed with your request.
                  </p>
                </div>
                <TabsList className="grid w-full max-w-md grid-cols-2 bg-[var(--surm-beige)] p-1 rounded-full">
                  <TabsTrigger value="medical" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Medical Certificate</TabsTrigger>
                  <TabsTrigger value="dismissal" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Early Dismissal</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="medical" className="mt-0 focus-visible:outline-none">
                <div className="max-w-3xl mx-auto">
                  {/* Medical Certificate Form */}
                  <section className="rounded-3xl bg-white p-5 sm:p-6 lg:p-8 border border-[var(--surm-green)]/10 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-3 mb-5 sm:mb-6">
                  <div className="h-8 w-1.5 rounded-full bg-[var(--surm-accent)]"></div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--surm-text-dark)]">
                    Medical Certification
                  </h3>
                </div>
                <form
                  onSubmit={handleMedicalCertSubmit}
                  className="space-y-4 sm:space-y-5"
                >
                  <div>
                    <Label htmlFor="medical-full-name" className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block text-base">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="medical-full-name"
                      type="text"
                      value={medicalForm.fullName}
                      onChange={(e) => setMedicalForm({ ...medicalForm, fullName: e.target.value })}
                      disabled={!canUploadMore || uploadingFormType === "MEDICAL_CERT"}
                      className="bg-white border-[var(--surm-green)]/20 focus:border-[var(--surm-accent)] focus:ring-[var(--surm-accent)] h-12 text-base"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="medical-class" className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block text-base">
                      Class <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="medical-class"
                      type="text"
                      value={medicalForm.class}
                      onChange={(e) => setMedicalForm({ ...medicalForm, class: e.target.value })}
                      disabled={!canUploadMore || uploadingFormType === "MEDICAL_CERT"}
                      className="bg-white border-[var(--surm-green)]/20 focus:border-[var(--surm-accent)] focus:ring-[var(--surm-accent)] h-12 text-base"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="medical-date" className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block text-base">
                      Date <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--surm-green)]/60" />
                      <Input
                        id="medical-date"
                        type="date"
                        value={medicalForm.date}
                        onChange={(e) => setMedicalForm({ ...medicalForm, date: e.target.value })}
                        disabled={!canUploadMore || uploadingFormType === "MEDICAL_CERT"}
                        className="bg-white border-[var(--surm-green)]/20 focus:border-[var(--surm-accent)] focus:ring-[var(--surm-accent)] pl-12 h-12 text-base"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="medical-reason" className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block text-base">
                      Reason for MC <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="medical-reason"
                      value={medicalForm.reason}
                      onChange={(e) => setMedicalForm({ ...medicalForm, reason: e.target.value })}
                      disabled={!canUploadMore || uploadingFormType === "MEDICAL_CERT"}
                      className="min-h-[120px] bg-white border-[var(--surm-green)]/20 focus:border-[var(--surm-accent)] focus:ring-[var(--surm-accent)] text-base resize-none"
                      placeholder="Please provide the reason for medical certification"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="medical-file" className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block text-base">
                      Upload your Medical Certification <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <input
                        id="medical-file"
                        name="file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={!canUploadMore || uploadingFormType === "MEDICAL_CERT"}
                        onChange={(e) => setMedicalForm({ ...medicalForm, file: e.target.files?.[0] || null })}
                        className="hidden"
                        required
                      />
                      <label
                        htmlFor="medical-file"
                        className={`flex flex-col items-center justify-center gap-3 w-full px-6 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
                          !canUploadMore || uploadingFormType === "MEDICAL_CERT"
                            ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-70"
                            : "bg-[var(--surm-paper)] border-[var(--surm-green)]/30 hover:border-[var(--surm-accent)] hover:bg-[var(--surm-beige)]/10"
                        }`}
                      >
                        <div className={`p-3 rounded-full ${
                          !canUploadMore || uploadingFormType === "MEDICAL_CERT"
                            ? "bg-gray-100"
                            : "bg-[var(--surm-green)]/5 text-[var(--surm-green)]"
                        }`}>
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <span className="text-base font-semibold text-[var(--surm-text-dark)] block mb-1">
                            {medicalForm.file ? medicalForm.file.name : "Click to upload file"}
                          </span>
                          <span className="text-sm text-[var(--surm-text-dark)]/60">
                            PDF, JPG, PNG (Max 5MB)
                          </span>
                        </div>
                      </label>
                      {uploadProgress > 0 && uploadingFormType === "MEDICAL_CERT" && (
                        <div className="mt-4 w-full bg-[var(--surm-green)]/10 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-[var(--surm-green)] h-full rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                            aria-valuenow={uploadProgress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={!canUploadMore || uploadingFormType === "MEDICAL_CERT"}
                    className="w-full rounded-xl bg-[#0F2C18] text-white hover:bg-[#0F2C18]/90 py-6 text-base font-medium shadow-md hover:shadow-lg transition-all duration-300 border-0"
                  >
                    {uploadingFormType === "MEDICAL_CERT" ? "Submitting..." : "Submit Application"}
                  </Button>
                </form>
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="dismissal" className="mt-0 focus-visible:outline-none">
                <div className="max-w-3xl mx-auto">
                  {/* Early Dismissal Form */}
                  <section className="rounded-3xl bg-white p-5 sm:p-6 lg:p-8 border border-[var(--surm-green)]/10 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-3 mb-5 sm:mb-6">
                  <div className="h-8 w-1.5 rounded-full bg-[var(--surm-accent)]"></div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--surm-text-dark)]">
                    Early Dismissal Form
                  </h3>
                </div>
                <form
                  onSubmit={handleEarlyDismissalSubmit}
                  className="space-y-5 sm:space-y-6"
                >
                  <div>
                    <Label htmlFor="dismissal-parent-name" className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block text-base">
                      Parent Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dismissal-parent-name"
                      type="text"
                      aria-label="Parent Full Name"
                      value={dismissalForm.parentName}
                      onChange={(e) => setDismissalForm({ ...dismissalForm, parentName: e.target.value })}
                      disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                      className="bg-white border-[var(--surm-green)]/20 focus:border-[var(--surm-accent)] focus:ring-[var(--surm-accent)] h-12 text-base"
                      required
                    />
                    {dismissalErrors.parentName && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{dismissalErrors.parentName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="dismissal-full-name" className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block text-base">
                      Student Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dismissal-full-name"
                      type="text"
                      aria-label="Student Full Name"
                      value={dismissalForm.fullName}
                      onChange={(e) => setDismissalForm({ ...dismissalForm, fullName: e.target.value })}
                      disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                      className="bg-white border-[var(--surm-green)]/20 focus:border-[var(--surm-accent)] focus:ring-[var(--surm-accent)] h-12 text-base"
                      required
                    />
                    {dismissalErrors.fullName && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{dismissalErrors.fullName}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="dismissal-ic-number" className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block text-base">
                      IC Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dismissal-ic-number"
                      type="text"
                      aria-label="IC Number"
                      placeholder="e.g. 123456-78-9012 or 123456789012"
                      value={dismissalForm.icNumber}
                      onChange={(e) => setDismissalForm({ ...dismissalForm, icNumber: e.target.value })}
                      disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                      className="bg-white border-[var(--surm-green)]/20 focus:border-[var(--surm-accent)] focus:ring-[var(--surm-accent)] h-12 text-base"
                      required
                    />
                    {dismissalErrors.icNumber && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{dismissalErrors.icNumber}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="dismissal-class" className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block text-base">
                      Class <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dismissal-class"
                      type="text"
                      aria-label="Class"
                      value={dismissalForm.class}
                      onChange={(e) => setDismissalForm({ ...dismissalForm, class: e.target.value })}
                      disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                      className="bg-white border-[var(--surm-green)]/20 focus:border-[var(--surm-accent)] focus:ring-[var(--surm-accent)] h-12 text-base"
                      required
                    />
                    {dismissalErrors.class && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{dismissalErrors.class}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block text-base">
                      Date and time <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                      <Input
                        type="number"
                        placeholder="Day"
                        min="1"
                        max="31"
                        aria-label="Day"
                        value={dismissalForm.day}
                        onChange={(e) => setDismissalForm({ ...dismissalForm, day: e.target.value })}
                        disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                        className="bg-white border-[var(--surm-green)]/20 focus:border-[var(--surm-accent)] focus:ring-[var(--surm-accent)] h-12 text-base"
                        required
                      />
                      <Select
                        value={dismissalForm.month}
                        onValueChange={(value) => setDismissalForm({ ...dismissalForm, month: value })}
                        disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                      >
                        <SelectTrigger className="bg-white border-[var(--surm-green)]/20 focus:ring-[var(--surm-accent)] h-12 text-base sm:col-span-2">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                            <SelectItem key={month} value={month.toString()}>
                              {new Date(2000, month - 1).toLocaleString("default", { month: "long" })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Year"
                        min="2024"
                        max="2100"
                        aria-label="Year"
                        value={dismissalForm.year}
                        onChange={(e) => setDismissalForm({ ...dismissalForm, year: e.target.value })}
                        disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                        className="bg-white border-[var(--surm-green)]/20 focus:border-[var(--surm-accent)] focus:ring-[var(--surm-accent)] h-12 text-base"
                        required
                      />
                      <div className="flex gap-1 col-span-2 sm:col-span-2 relative z-20">
                        <Input
                          type="time"
                          aria-label="Time"
                          value={dismissalForm.time}
                          onChange={(e) => setDismissalForm({ ...dismissalForm, time: e.target.value })}
                          disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                          className="bg-white border-[var(--surm-green)]/20 focus:border-[var(--surm-accent)] focus:ring-[var(--surm-accent)] h-12 text-base flex-1"
                          required
                        />
                        <Select
                          value={dismissalForm.ampm}
                          onValueChange={(value) => setDismissalForm({ ...dismissalForm, ampm: value })}
                          disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                        >
                          <SelectTrigger className="w-16 sm:w-20 bg-white border-[var(--surm-green)]/20 focus:ring-[var(--surm-accent)] h-12 text-base z-30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-50 bg-white border border-[var(--surm-green)]/20">
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {dismissalErrors.date && (
                        <p className="col-span-2 sm:col-span-4 text-xs text-red-600 mt-1 font-medium">{dismissalErrors.date}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="dismissal-reason" className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block text-base">
                      Reason <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="dismissal-reason"
                      aria-label="Reason"
                      value={dismissalForm.reason}
                      onChange={(e) => setDismissalForm({ ...dismissalForm, reason: e.target.value })}
                      disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                      className="min-h-[120px] bg-white border-[var(--surm-green)]/20 focus:border-[var(--surm-accent)] focus:ring-[var(--surm-accent)] text-base resize-none"
                      placeholder="Please provide the reason for early dismissal"
                      required
                    />
                    {dismissalErrors.reason && (
                      <p className="text-xs text-red-600 mt-1 font-medium">{dismissalErrors.reason}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="dismissal-transport" className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block text-base">
                      Transport details <span className="text-[var(--surm-text-dark)]/50 text-sm font-normal ml-1">(optional)</span>
                    </Label>
                    <Textarea
                      id="dismissal-transport"
                      aria-label="Transport details"
                      value={dismissalForm.transport}
                      onChange={(e) => setDismissalForm({ ...dismissalForm, transport: e.target.value })}
                      disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                      className="min-h-[80px] bg-white border-[var(--surm-green)]/20 focus:border-[var(--surm-accent)] focus:ring-[var(--surm-accent)] text-base resize-none"
                      placeholder="E.g., Picked up by parent at gate"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block text-base">
                      Digital Signature <span className="text-red-500">*</span>
                    </Label>
                    <div className="bg-white border border-[var(--surm-green)]/20 rounded-xl p-4 shadow-inner">
                      <canvas
                        ref={signatureCanvasRef}
                        aria-label="Signature Pad"
                        className="w-full h-40 bg-[var(--surm-paper)] rounded-lg touch-none border border-dashed border-[var(--surm-green)]/20 cursor-crosshair"
                        onPointerDown={(e) => {
                          const canvas = signatureCanvasRef.current!;
                          const rect = canvas.getBoundingClientRect();
                          const ctx = canvas.getContext("2d")!;
                          canvas.width = rect.width;
                          canvas.height = rect.height;
                          ctx.lineWidth = 2;
                          ctx.lineCap = "round";
                          ctx.strokeStyle = "#0F2C18"; // surm-green
                          isDrawingRef.current = true;
                          ctx.beginPath();
                          ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                        }}
                        onPointerMove={(e) => {
                          if (!isDrawingRef.current) return;
                          const canvas = signatureCanvasRef.current!;
                          const ctx = canvas.getContext("2d")!;
                          ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                          ctx.stroke();
                          setHasSignature(true);
                        }}
                        onPointerUp={() => {
                          isDrawingRef.current = false;
                        }}
                        onPointerLeave={() => {
                          isDrawingRef.current = false;
                        }}
                      />
                      <div className="mt-3 flex items-center justify-between">
                        {!hasSignature ? (
                          <p className="text-sm text-[var(--surm-text-dark)]/60 font-sans italic">Please sign in the box above</p>
                        ) : (
                          <p className="text-sm text-[var(--surm-accent)] font-sans font-medium">Signature captured</p>
                        )}
                        <Button
                          type="button"
                          aria-label="Clear signature"
                          variant="outline"
                          onClick={() => clearSignature()}
                          disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                          className="text-xs h-8 border-[var(--surm-green)]/30 text-[var(--surm-green)] hover:bg-[var(--surm-green)]/5 hover:text-[var(--surm-green)]"
                        >
                          Clear Signature
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block text-base">
                      Supporting Documents
                    </Label>
                    <p className="text-sm text-[var(--surm-text-dark)]/70 mb-3 font-sans">
                      Please share any supporting documents related to your request.
                    </p>
                    <div className="relative">
                      <input
                        id="dismissal-file"
                        name="file"
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                        onChange={(e) => setDismissalForm({ ...dismissalForm, file: e.target.files?.[0] || null })}
                        className="hidden"
                      />
                      <label
                        htmlFor="dismissal-file"
                        className={`flex flex-col items-center justify-center gap-3 w-full px-6 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
                          !canUploadMore || uploadingFormType === "EARLY_DISMISSAL"
                            ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-70"
                            : "bg-[var(--surm-paper)] border-[var(--surm-green)]/30 hover:border-[var(--surm-accent)] hover:bg-[var(--surm-beige)]/10"
                        }`}
                      >
                        <div className={`p-3 rounded-full ${
                          !canUploadMore || uploadingFormType === "EARLY_DISMISSAL"
                            ? "bg-gray-100"
                            : "bg-[var(--surm-green)]/5 text-[var(--surm-green)]"
                        }`}>
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <span className="text-base font-semibold text-[var(--surm-text-dark)] block mb-1">
                            {dismissalForm.file ? dismissalForm.file.name : "Click to upload file"}
                          </span>
                          <span className="text-sm text-[var(--surm-text-dark)]/60">
                            PDF, Word, Images (Max 5MB)
                          </span>
                        </div>
                      </label>
                      {uploadProgress > 0 && uploadingFormType === "EARLY_DISMISSAL" && (
                        <div className="mt-4 w-full bg-[var(--surm-green)]/10 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-[var(--surm-green)] h-full rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                            aria-valuenow={uploadProgress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                    className="w-full rounded-xl bg-[#0F2C18] text-white hover:bg-[#0F2C18]/90 py-6 text-base font-medium shadow-md hover:shadow-lg transition-all duration-300 border-0"
                  >
                    {uploadingFormType === "EARLY_DISMISSAL" ? "Submitting..." : "Submit Application"}
                  </Button>
                </form>
                  </section>
                </div>
              </TabsContent>
            </Tabs>

            {uploadMessage && (
              <section className={`rounded-2xl p-6 flex items-start gap-4 animate-in slide-in-from-bottom-2 duration-300 ${
                uploadMessage.includes("Error")
                  ? "bg-red-50 border border-red-100"
                  : "bg-[var(--surm-green)] text-white shadow-lg"
              }`}>
                {uploadMessage.includes("Error") ? (
                  <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                ) : (
                  <div className="p-1 bg-white/20 rounded-full shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  <h4 className={`font-serif font-bold mb-1 ${
                    uploadMessage.includes("Error") ? "text-red-800" : "text-white"
                  }`}>
                    {uploadMessage.includes("Error") ? "Submission Failed" : "Submission Successful"}
                  </h4>
                  <p className={`text-sm font-sans ${
                    uploadMessage.includes("Error") ? "text-red-700" : "text-white/90"
                  }`}>
                    {uploadMessage}
                  </p>
                </div>
              </section>
            )}

            {/* Letters Status - Beige Panel */}
            <section className="rounded-3xl bg-[var(--surm-beige)] p-6 sm:p-8 lg:p-10 shadow-inner">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-[var(--surm-text-dark)] mb-2">
                    Submission History
                  </h3>
                  <p className="text-[var(--surm-text-dark)]/80 font-sans">
                    Track your recent medical certificates and early dismissal requests.
                  </p>
                </div>
                <div className="bg-white/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-[var(--surm-text-dark)]/5">
                  <p className="text-sm font-medium text-[var(--surm-text-dark)]/70 font-sans uppercase tracking-wider mb-1">
                    Annual Limit
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-serif font-bold text-[var(--surm-text-dark)]">
                      {formSubmissions.length}
                    </span>
                    <span className="text-[var(--surm-text-dark)]/60 font-sans">
                      / 5 used
                    </span>
                  </div>
                </div>
              </div>
              
              {!canUploadMore && (
                <div className="flex items-center gap-3 p-4 bg-red-100/80 border border-red-200 rounded-xl mb-6 text-red-800">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-sans font-medium">
                    You have reached the maximum upload limit (5 files) for the year {currentYear}. Please contact administration for assistance.
                  </p>
                </div>
              )}
              
              {formSubmissions.length > 0 ? (
                <div className="bg-white/60 rounded-2xl overflow-hidden border border-[var(--surm-text-dark)]/5">
                  <div className="grid grid-cols-1 divide-y divide-[var(--surm-text-dark)]/5">
                    {formSubmissions.map((sub) => (
                      <div key={sub.id} className="p-4 sm:p-5 hover:bg-white/80 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-full ${
                            sub.type === "MEDICAL_CERT" 
                              ? "bg-[var(--surm-accent)]/10 text-[var(--surm-accent)]" 
                              : "bg-[var(--surm-green)]/10 text-[var(--surm-green)]"
                          }`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-serif font-semibold text-[var(--surm-text-dark)]">
                              {sub.type === "MEDICAL_CERT" ? "Medical Certificate" : "Early Dismissal Form"}
                            </p>
                            <p className="text-sm text-[var(--surm-text-dark)]/60 font-sans mt-0.5">
                              Submitted on {format(new Date(sub.createdAt), "PPP 'at' p")}
                            </p>
                          </div>
                        </div>
                        {sub.fileUrl && (
                          <a 
                            href={sub.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 text-[var(--surm-text-dark)]/40 hover:text-[var(--surm-accent)] hover:bg-[var(--surm-accent)]/5 rounded-full transition-all"
                            title="View Document"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-[var(--surm-text-dark)]/10 rounded-2xl">
                  <div className="inline-flex p-4 rounded-full bg-[var(--surm-text-dark)]/5 text-[var(--surm-text-dark)]/40 mb-3">
                    <File className="w-8 h-8" />
                  </div>
                  <p className="text-[var(--surm-text-dark)]/60 font-sans">
                    No submissions found for {currentYear}.
                  </p>
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

