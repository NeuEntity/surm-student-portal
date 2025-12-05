"use client";

import { useState } from "react";
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
    day: "",
    month: "",
    year: "",
    time: "",
    ampm: "AM",
    reason: "",
    file: null as File | null,
  });
  
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
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          throw new Error("File upload failed");
        }

        const uploadData = await uploadRes.json();
        fileUrl = uploadData.fileUrl;
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
          day: "",
          month: "",
          year: "",
          time: "",
          ampm: "AM",
          reason: "",
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
      // Upload file
      const uploadFormData = new FormData();
      uploadFormData.append("file", medicalForm.file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        throw new Error("File upload failed");
      }

      const { fileUrl } = await uploadRes.json();

      const metadata = {
        fullName: medicalForm.fullName,
        class: medicalForm.class,
        date: medicalForm.date,
        reason: medicalForm.reason,
      };

      // Create submission
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
    
    if (!dismissalForm.fullName || !dismissalForm.class || !dismissalForm.day || 
        !dismissalForm.month || !dismissalForm.year || !dismissalForm.time || !dismissalForm.reason) {
      setUploadMessage("Please fill in all required fields");
      return;
    }
    
    setUploading(true);
    setUploadMessage("");
    setUploadingFormType("EARLY_DISMISSAL");
    
    try {
      let fileUrl = "";
      
      // Upload file if provided (optional for early dismissal)
      if (dismissalForm.file) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", dismissalForm.file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          throw new Error("File upload failed");
        }

        const uploadData = await uploadRes.json();
        fileUrl = uploadData.fileUrl;
      }
      
      const dateTime = `${dismissalForm.year}-${dismissalForm.month.padStart(2, "0")}-${dismissalForm.day.padStart(2, "0")} ${dismissalForm.time} ${dismissalForm.ampm}`;
      
      const metadata = {
        fullName: dismissalForm.fullName,
        class: dismissalForm.class,
        date: dismissalForm.day,
        month: dismissalForm.month,
        year: dismissalForm.year,
        time: dismissalForm.time,
        ampm: dismissalForm.ampm,
        dateTime: dateTime,
        reason: dismissalForm.reason,
      };
      
      // Create submission (file is optional for early dismissal)
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

      setUploadMessage("Early dismissal form submitted successfully!");
      
      // Reset form
      setDismissalForm({
        fullName: userName,
        class: level.replace("SECONDARY_", "Secondary "),
        day: "",
        month: "",
        year: "",
        time: "",
        ampm: "AM",
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

  async function handleAssignmentUpload(
    event: React.FormEvent<HTMLFormElement>,
    assignmentId: string
  ) {
    await handleFileUpload(event, "ASSIGNMENT", assignmentId);
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

          <TabsContent value="uploads" className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              {/* Medical Certificate Form */}
              <section className="rounded-2xl bg-white p-4 sm:p-6 lg:p-8 border border-gray-200">
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[var(--surm-text-dark)] mb-4 sm:mb-6">
                  Medical Certification
                </h3>
                <form
                  onSubmit={handleMedicalCertSubmit}
                  className="space-y-4 sm:space-y-5"
                >
                  <div>
                    <Label htmlFor="medical-full-name" className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="medical-full-name"
                      type="text"
                      value={medicalForm.fullName}
                      onChange={(e) => setMedicalForm({ ...medicalForm, fullName: e.target.value })}
                      disabled={!canUploadMore || uploadingFormType === "MEDICAL_CERT"}
                      className="bg-white border-gray-300"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="medical-class" className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block">
                      Class <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="medical-class"
                      type="text"
                      value={medicalForm.class}
                      onChange={(e) => setMedicalForm({ ...medicalForm, class: e.target.value })}
                      disabled={!canUploadMore || uploadingFormType === "MEDICAL_CERT"}
                      className="bg-white border-gray-300"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="medical-date" className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block">
                      Date <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="medical-date"
                        type="date"
                        value={medicalForm.date}
                        onChange={(e) => setMedicalForm({ ...medicalForm, date: e.target.value })}
                        disabled={!canUploadMore || uploadingFormType === "MEDICAL_CERT"}
                        className="bg-white border-gray-300 pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="medical-reason" className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block">
                      Reason for MC <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="medical-reason"
                      value={medicalForm.reason}
                      onChange={(e) => setMedicalForm({ ...medicalForm, reason: e.target.value })}
                      disabled={!canUploadMore || uploadingFormType === "MEDICAL_CERT"}
                      className="min-h-[100px] bg-white border-gray-300"
                      placeholder="Please provide the reason for medical certification"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="medical-file" className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block">
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
                        className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                          !canUploadMore || uploadingFormType === "MEDICAL_CERT"
                            ? "bg-gray-100 border-gray-300 cursor-not-allowed"
                            : "bg-white border-gray-300 hover:border-[var(--surm-accent)] hover:bg-gray-50"
                        }`}
                      >
                        <Plus className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">
                          {medicalForm.file ? medicalForm.file.name : "Upload File"}
                        </span>
                      </label>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={!canUploadMore || uploadingFormType === "MEDICAL_CERT"}
                    className="w-full rounded-lg bg-black text-white hover:bg-gray-800 py-4 sm:py-6 text-sm sm:text-base font-medium"
                  >
                    {uploadingFormType === "MEDICAL_CERT" ? "Submitting..." : "Submit"}
                  </Button>
                </form>
              </section>

              {/* Early Dismissal Form */}
              <section className="rounded-2xl bg-white p-4 sm:p-6 lg:p-8 border border-gray-200">
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[var(--surm-text-dark)] mb-4 sm:mb-6">
                  Early Dismissal Form
                </h3>
                <form
                  onSubmit={handleEarlyDismissalSubmit}
                  className="space-y-4 sm:space-y-5"
                >
                  <div>
                    <Label htmlFor="dismissal-full-name" className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dismissal-full-name"
                      type="text"
                      value={dismissalForm.fullName}
                      onChange={(e) => setDismissalForm({ ...dismissalForm, fullName: e.target.value })}
                      disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                      className="bg-white border-gray-300"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dismissal-class" className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block">
                      Class <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dismissal-class"
                      type="text"
                      value={dismissalForm.class}
                      onChange={(e) => setDismissalForm({ ...dismissalForm, class: e.target.value })}
                      disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                      className="bg-white border-gray-300"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block">
                      Date and time <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Input
                        type="number"
                        placeholder="Day"
                        min="1"
                        max="31"
                        value={dismissalForm.day}
                        onChange={(e) => setDismissalForm({ ...dismissalForm, day: e.target.value })}
                        disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                        className="bg-white border-gray-300"
                        required
                      />
                      <Select
                        value={dismissalForm.month}
                        onValueChange={(value) => setDismissalForm({ ...dismissalForm, month: value })}
                        disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                      >
                        <SelectTrigger className="bg-white border-gray-300">
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
                        value={dismissalForm.year}
                        onChange={(e) => setDismissalForm({ ...dismissalForm, year: e.target.value })}
                        disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                        className="bg-white border-gray-300"
                        required
                      />
                      <div className="flex gap-1 col-span-2 sm:col-span-1">
                        <Input
                          type="time"
                          value={dismissalForm.time}
                          onChange={(e) => setDismissalForm({ ...dismissalForm, time: e.target.value })}
                          disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                          className="bg-white border-gray-300 flex-1"
                          required
                        />
                        <Select
                          value={dismissalForm.ampm}
                          onValueChange={(value) => setDismissalForm({ ...dismissalForm, ampm: value })}
                          disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                        >
                          <SelectTrigger className="w-16 sm:w-20 bg-white border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="dismissal-reason" className="text-[var(--surm-text-dark)] font-sans font-medium mb-2 block">
                      Reason <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="dismissal-reason"
                      value={dismissalForm.reason}
                      onChange={(e) => setDismissalForm({ ...dismissalForm, reason: e.target.value })}
                      disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                      className="min-h-[100px] bg-white border-gray-300"
                      placeholder="Please provide the reason for early dismissal"
                      required
                    />
                  </div>
                  
                  <div>
                    <p className="text-sm text-[var(--surm-text-dark)]/70 mb-2 font-sans">
                      Please share any supporting documents related to your request.
                    </p>
                    <div className="relative">
                      <input
                        id="dismissal-file"
                        name="file"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                        onChange={(e) => setDismissalForm({ ...dismissalForm, file: e.target.files?.[0] || null })}
                        className="hidden"
                      />
                      <label
                        htmlFor="dismissal-file"
                        className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                          !canUploadMore || uploadingFormType === "EARLY_DISMISSAL"
                            ? "bg-gray-100 border-gray-300 cursor-not-allowed"
                            : "bg-white border-gray-300 hover:border-[var(--surm-accent)] hover:bg-gray-50"
                        }`}
                      >
                        <Plus className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">
                          {dismissalForm.file ? dismissalForm.file.name : "Upload File"}
                        </span>
                      </label>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={!canUploadMore || uploadingFormType === "EARLY_DISMISSAL"}
                    className="w-full rounded-lg bg-black text-white hover:bg-gray-800 py-4 sm:py-6 text-sm sm:text-base font-medium"
                  >
                    {uploadingFormType === "EARLY_DISMISSAL" ? "Submitting..." : "Submit"}
                  </Button>
                </form>
              </section>
            </div>

            {uploadMessage && (
              <section className={`rounded-2xl p-6 ${
                uploadMessage.includes("Error")
                  ? "bg-red-50 border border-red-200"
                  : "bg-[var(--surm-beige)]/30 border border-[var(--surm-beige)]"
              }`}>
                <p className={`font-sans ${
                  uploadMessage.includes("Error") ? "text-red-700" : "text-[var(--surm-accent)]"
                }`}>
                  {uploadMessage}
                </p>
              </section>
            )}

            {/* Upload Status - Beige Panel */}
            <section className="rounded-2xl bg-[var(--surm-beige)] p-4 sm:p-6 lg:p-8">
              <h3 className="text-lg sm:text-xl font-serif font-semibold text-[var(--surm-text-dark)] mb-2">
                Upload Status
              </h3>
              <p className="text-sm text-[var(--surm-text-dark)]/80 mb-4 sm:mb-6 font-sans">
                You have used {formSubmissions.length} out of 5 uploads for {currentYear}
              </p>
              {!canUploadMore && (
                <div className="flex items-center gap-2 p-4 bg-[var(--surm-beige)]/50 border border-[var(--surm-beige)] rounded-lg mb-4">
                  <AlertCircle className="w-5 h-5 text-[var(--surm-text-dark)]/70" />
                  <p className="text-sm text-[var(--surm-text-dark)] font-sans">
                    You have reached the maximum upload limit (5 files)
                  </p>
                </div>
              )}
              {formSubmissions.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold text-sm text-[var(--surm-text-dark)] font-sans">Recent Uploads:</h4>
                  <ul className="space-y-2">
                    {formSubmissions.map((sub) => (
                      <li key={sub.id} className="text-sm text-[var(--surm-text-dark)]/70 flex items-center gap-2 font-sans">
                        <File className="w-4 h-4" />
                        {sub.type.replace("_", " ")} - {format(new Date(sub.createdAt), "PPP")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

