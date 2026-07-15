"use client";

import { useState } from "react";
import { Level, Subject } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, Star, X } from "lucide-react";
import { useRouter } from "next/navigation";

const SUBJECTS = [
  { value: Subject.AKIDAH, label: "Akidah" },
  { value: Subject.AKHLAK, label: "Akhlak" },
  { value: Subject.FIQH, label: "Fiqh" },
  { value: Subject.FARAIDH, label: "Faraidh" },
  { value: Subject.SIRAH, label: "Sirah" },
  { value: Subject.HADIS, label: "Hadis" },
  { value: Subject.MUSTOLAH_HADIS, label: "Mustolah Hadis" },
  { value: Subject.ENGLISH, label: "English" },
  { value: Subject.MALAY, label: "Bahasa Melayu" },
  { value: Subject.MATHS, label: "Maths" },
  { value: Subject.IRK, label: "IRK" },
  { value: Subject.TAFSIR, label: "Tafsir" },
  { value: Subject.TAJWID, label: "Tajwid" },
  { value: Subject.ULUM_QURAN, label: "Ulum Quran" },
  { value: Subject.TAHFIZ, label: "Tahfiz" },
  { value: Subject.LUGHAH, label: "Lughah" },
  { value: Subject.NAHU, label: "Nahu" },
];

const LEVELS = [
  { value: Level.SECONDARY_1, label: "Secondary 1" },
  { value: Level.SECONDARY_2, label: "Secondary 2" },
  { value: Level.SECONDARY_3, label: "Secondary 3" },
  { value: Level.SECONDARY_4, label: "Secondary 4" },
];

type UploadedAttachment = {
  url: string;
  name: string;
  type: string;
  size: number;
};

export function CreateAssignmentForm({ createAssignment }: { createAssignment: (formData: FormData) => Promise<void> }) {
  const router = useRouter();
  const [level, setLevel] = useState<Level | "">("");
  const [subject, setSubject] = useState<Subject | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setSelectedFiles((prev) => [...prev, ...files]);
    event.target.value = "";
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function promoteFile(index: number) {
    setSelectedFiles((prev) => {
      const next = [...prev];
      const [file] = next.splice(index, 1);
      next.unshift(file);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setFileError(null);

    // Validate required fields
    if (!level || !subject) {
      alert("Please select both level and subject");
      setIsSubmitting(false);
      return;
    }

    // Store form reference before async operations
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Ensure level and subject are set from state (Select components may not submit properly)
    formData.set("level", level);
    formData.set("subject", subject);

    try {
      if (selectedFiles.length > 0) {
        const uploadedAttachments: UploadedAttachment[] = [];
        for (const file of selectedFiles) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", file);
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: uploadFormData,
          });

          if (!uploadRes.ok) {
            const errorData = await uploadRes.json().catch(() => ({}));
            throw new Error(errorData.error || "File upload failed");
          }

          const uploadData = await uploadRes.json();
          uploadedAttachments.push({
            url: uploadData.fileUrl,
            name: uploadData.fileName || file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
          });
        }

        formData.set("fileUrl", uploadedAttachments[0]?.url || "");
      }

      await createAssignment(formData);
      router.refresh();
      // Reset form - check if form still exists
      if (form) {
        form.reset();
      }
      setLevel("");
      setSubject("");
      setSelectedFiles([]);
    } catch (error: any) {
      console.error("Error creating assignment:", error);
      const errorMessage = error?.message || "Failed to create assignment. Please try again.";
      setFileError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="assign-level">Level *</Label>
          <Select value={level} onValueChange={(value) => setLevel(value as Level)} required>
            <SelectTrigger id="assign-level">
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
        <div className="space-y-2">
          <Label htmlFor="assign-subject">Subject *</Label>
          <Select value={subject} onValueChange={(value) => setSubject(value as Subject)} required>
            <SelectTrigger id="assign-subject">
              <SelectValue placeholder="Select subject" />
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
        <Label htmlFor="assign-title">Title *</Label>
        <Input id="assign-title" name="title" placeholder="e.g., Essay on Islamic Principles" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="assign-description">Description *</Label>
        <Textarea
          id="assign-description"
          name="description"
          placeholder="Assignment instructions..."
          rows={3}
          required
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="assign-fileUrl">File URL</Label>
          <Input id="assign-fileUrl" name="fileUrl" type="url" placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assign-videoUrl">Video URL</Label>
          <Input id="assign-videoUrl" name="videoUrl" type="url" placeholder="https://..." />
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/30 bg-white/70 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Upload Files</Label>
            <p className="text-xs text-[var(--surm-text-dark)]/70">
              The first file becomes the File URL above. Upload reference files, worksheets, etc.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-[var(--surm-text-dark)] shadow">
            <Upload className="w-4 h-4" />
            Add Files
            <input type="file" multiple className="hidden" onChange={handleFileSelection} />
          </label>
        </div>

        {fileError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {fileError}
          </p>
        )}

        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-lg border border-[var(--surm-green)]/20 bg-white px-3 py-2 text-sm"
              >
                <div className="flex-1">
                  <p className="font-medium text-[var(--surm-text-dark)]">
                    {file.name}
                    {index === 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[var(--surm-accent)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--surm-accent)]">
                        <Star className="w-3 h-3" />
                        Preview
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--surm-text-dark)]/60">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || "Unknown type"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {index !== 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => promoteFile(index)}
                    >
                      Make Primary
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-red-500 hover:text-red-600"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-4 h-4" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full rounded-full bg-white text-[var(--surm-green)] hover:bg-[var(--surm-paper)]" disabled={isSubmitting}>
        <Plus className="w-4 h-4 mr-2" />
        {isSubmitting ? "Creating..." : "Create Assignment"}
      </Button>
    </form>
  );
}





