import { Level, Subject } from "@prisma/client";

/**
 * Detailed curriculum subject lists per secondary level.
 * This structure reflects the enhanced curriculum requirements.
 * Note: Some subjects here map to the same database Enum value (e.g., Tajwid, Tafsir -> IRK).
 */

export interface CurriculumSubject {
  name: string;
  code?: string; // Optional mapping to database Subject enum
  description?: string;
}

export const SECONDARY_1_SUBJECTS: CurriculumSubject[] = [
  { name: "Tajwid", code: "IRK" },
  { name: "Tafsir", code: "IRK" },
  { name: "Hadis", code: "HADIS" },
  { name: "Akidah", code: "AKIDAH" },
  { name: "Fiqh", code: "FIQH" },
  { name: "Sirah", code: "SIRAH" },
  { name: "Akhlak", code: "AKHLAK" },
  { name: "Lughah", code: "ARABIC" },
  { name: "Nahu", code: "ARABIC" },
  { name: "Bahasa Melayu", code: "MALAY" },
  { name: "English", code: "ENGLISH" },
  { name: "Mathematics", code: "MATHS" },
];

export const SECONDARY_2_SUBJECTS: CurriculumSubject[] = [
  { name: "Tajwid", code: "IRK" },
  { name: "Tafsir", code: "IRK" },
  { name: "Hadis", code: "HADIS" },
  { name: "Akidah", code: "AKIDAH" },
  { name: "Fiqh", code: "FIQH" },
  { name: "Sirah", code: "SIRAH" },
  { name: "Akhlak", code: "AKHLAK" },
  { name: "Lughah", code: "ARABIC" },
  { name: "Nahu", code: "ARABIC" },
  { name: "Bahasa Melayu", code: "MALAY" },
  { name: "English", code: "ENGLISH" },
  { name: "Mathematics", code: "MATHS" },
];

export const SECONDARY_3_SUBJECTS: CurriculumSubject[] = [
  { name: "Tajwid", code: "IRK" },
  { name: "Tafsir", code: "IRK" },
  { name: "Hadis", code: "HADIS" },
  { name: "Mustolah Hadis", code: "MUSTOLAH_HADIS" },
  { name: "Akidah", code: "AKIDAH" },
  { name: "Fiqh", code: "FIQH" },
  { name: "I.R.K", code: "IRK" },
  { name: "Akhlak", code: "AKHLAK" },
  { name: "Lughah", code: "ARABIC" },
  { name: "Nahu", code: "ARABIC" },
  { name: "Bahasa Melayu", code: "MALAY" },
  { name: "English", code: "ENGLISH" },
  { name: "Mathematics", code: "MATHS" },
];

export const SECONDARY_4_SUBJECTS: CurriculumSubject[] = [
  { name: "Ulum Quran", code: "IRK" },
  { name: "Hadis", code: "HADIS" },
  { name: "Mustolah Hadis", code: "MUSTOLAH_HADIS" },
  { name: "Akidah", code: "AKIDAH" },
  { name: "Fiqh", code: "FIQH" },
  { name: "I.R.K", code: "IRK" },
  { name: "Akhlak", code: "AKHLAK" },
  { name: "Lughah", code: "ARABIC" },
  { name: "Bahasa Melayu", code: "MALAY" },
  { name: "English", code: "ENGLISH" },
  { name: "Mathematics", code: "MATHS" },
];

export const CURRICULUM_BY_LEVEL: Record<Level, CurriculumSubject[]> = {
  [Level.SECONDARY_1]: SECONDARY_1_SUBJECTS,
  [Level.SECONDARY_2]: SECONDARY_2_SUBJECTS,
  [Level.SECONDARY_3]: SECONDARY_3_SUBJECTS,
  [Level.SECONDARY_4]: SECONDARY_4_SUBJECTS,
};
