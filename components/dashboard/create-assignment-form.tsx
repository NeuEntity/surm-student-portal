"use client";

import { useState } from "react";
import { Level, Subject } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
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

export function CreateAssignmentForm({ createAssignment }: { createAssignment: (formData: FormData) => Promise<void> }) {
  const router = useRouter();
  const [level, setLevel] = useState<Level | "">("");
  const [subject, setSubject] = useState<Subject | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

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
      await createAssignment(formData);
      router.refresh();
      // Reset form - check if form still exists
      if (form) {
        form.reset();
      }
      setLevel("");
      setSubject("");
    } catch (error: any) {
      console.error("Error creating assignment:", error);
      const errorMessage = error?.message || "Failed to create assignment. Please try again.";
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
      <div className="space-y-2">
        <Label htmlFor="assign-due">Due Date *</Label>
        <Input id="assign-due" name="dueDate" type="date" required />
      </div>
      <Button type="submit" className="w-full rounded-full bg-white text-[var(--surm-green)] hover:bg-[var(--surm-paper)]" disabled={isSubmitting}>
        <Plus className="w-4 h-4 mr-2" />
        {isSubmitting ? "Creating..." : "Create Assignment"}
      </Button>
    </form>
  );
}





