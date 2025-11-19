import { PrismaClient, Role, Level, Subject } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed for SURM (Sekolah Ugama Radin Mas)...");

  // Clear all existing data
  console.log("Clearing existing data...");
  await prisma.grades.deleteMany({});
  await prisma.submissions.deleteMany({});
  await prisma.assignments.deleteMany({});
  await prisma.learning_materials.deleteMany({});
  await prisma.users.deleteMany({});
  console.log("All existing data cleared.");

  // Hash password for all users (password: "password123")
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create students for each level (SURM-style names)
  const students = [
    // Secondary 1 students
    {
      email: "ahmad.rahman@surm.edu.sg",
      name: "Ahmad bin Rahman",
      role: Role.STUDENT,
      level: Level.SECONDARY_1,
      icNumber: "S1234567A",
      phoneNumber: "+65 9123 4567",
      parentName: "Rahman bin Ahmad",
      parentPhone: "+65 9123 4568",
    },
    {
      email: "siti.nurhaliza@surm.edu.sg",
      name: "Siti Nurhaliza binti Hassan",
      role: Role.STUDENT,
      level: Level.SECONDARY_1,
      icNumber: "S1234568B",
      phoneNumber: "+65 9123 4569",
      parentName: "Hassan bin Ismail",
      parentPhone: "+65 9123 4570",
    },
    {
      email: "muhammad.ali@surm.edu.sg",
      name: "Muhammad Ali bin Yusuf",
      role: Role.STUDENT,
      level: Level.SECONDARY_1,
      icNumber: "S1234569C",
      phoneNumber: "+65 9123 4571",
      parentName: "Yusuf bin Omar",
      parentPhone: "+65 9123 4572",
    },

    // Secondary 2 students
    {
      email: "fatimah.azizah@surm.edu.sg",
      name: "Fatimah Azizah binti Abdullah",
      role: Role.STUDENT,
      level: Level.SECONDARY_2,
      icNumber: "S1234570D",
      phoneNumber: "+65 9123 4573",
      parentName: "Abdullah bin Ibrahim",
      parentPhone: "+65 9123 4574",
    },
    {
      email: "omar.hassan@surm.edu.sg",
      name: "Omar Hassan bin Malik",
      role: Role.STUDENT,
      level: Level.SECONDARY_2,
      icNumber: "S1234571E",
      phoneNumber: "+65 9123 4575",
      parentName: "Malik bin Ahmad",
      parentPhone: "+65 9123 4576",
    },
    {
      email: "aisha.rahman@surm.edu.sg",
      name: "Aisha binti Rahman",
      role: Role.STUDENT,
      level: Level.SECONDARY_2,
      icNumber: "S1234572F",
      phoneNumber: "+65 9123 4577",
      parentName: "Rahman bin Hassan",
      parentPhone: "+65 9123 4578",
    },

    // Secondary 3 students
    {
      email: "ibrahim.yusuf@surm.edu.sg",
      name: "Ibrahim Yusuf bin Omar",
      role: Role.STUDENT,
      level: Level.SECONDARY_3,
      icNumber: "S1234573G",
      phoneNumber: "+65 9123 4579",
      parentName: "Omar bin Abdullah",
      parentPhone: "+65 9123 4580",
    },
    {
      email: "khadijah.aminah@surm.edu.sg",
      name: "Khadijah Aminah binti Hassan",
      role: Role.STUDENT,
      level: Level.SECONDARY_3,
      icNumber: "S1234574H",
      phoneNumber: "+65 9123 4581",
      parentName: "Hassan bin Malik",
      parentPhone: "+65 9123 4582",
    },
    {
      email: "zain.abdullah@surm.edu.sg",
      name: "Zain Abdullah bin Ibrahim",
      role: Role.STUDENT,
      level: Level.SECONDARY_3,
      icNumber: "S1234575I",
      phoneNumber: "+65 9123 4583",
      parentName: "Ibrahim bin Yusuf",
      parentPhone: "+65 9123 4584",
    },

    // Secondary 4 students
    {
      email: "mariam.hassan@surm.edu.sg",
      name: "Mariam binti Hassan",
      role: Role.STUDENT,
      level: Level.SECONDARY_4,
      icNumber: "S1234576J",
      phoneNumber: "+65 9123 4585",
      parentName: "Hassan bin Omar",
      parentPhone: "+65 9123 4586",
    },
    {
      email: "yusuf.ibrahim@surm.edu.sg",
      name: "Yusuf Ibrahim bin Abdullah",
      role: Role.STUDENT,
      level: Level.SECONDARY_4,
      icNumber: "S1234577K",
      phoneNumber: "+65 9123 4587",
      parentName: "Abdullah bin Rahman",
      parentPhone: "+65 9123 4588",
    },
    {
      email: "ruqayyah.omar@surm.edu.sg",
      name: "Ruqayyah binti Omar",
      role: Role.STUDENT,
      level: Level.SECONDARY_4,
      icNumber: "S1234578L",
      phoneNumber: "+65 9123 4589",
      parentName: "Omar bin Hassan",
      parentPhone: "+65 9123 4590",
    },
  ];

  const createdStudents = [];
  for (const studentData of students) {
    const student = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email: studentData.email,
        password: hashedPassword,
        name: studentData.name,
        role: studentData.role,
        level: studentData.level,
        icNumber: studentData.icNumber,
        phoneNumber: studentData.phoneNumber,
        parentName: studentData.parentName,
        parentPhone: studentData.parentPhone,
        updatedAt: new Date(),
      },
    });
    createdStudents.push(student);
  }

  // Create teachers
  const teachers = [
    {
      email: "ustaz.abdulrahman@surm.edu.sg",
      name: "Ustaz Abdul Rahman bin Hassan",
    },
    {
      email: "ustazah.fatimah@surm.edu.sg",
      name: "Ustazah Fatimah binti Abdullah",
    },
    {
      email: "ustaz.muhammad@surm.edu.sg",
      name: "Ustaz Muhammad bin Ibrahim",
    },
  ];

  const createdTeachers = [];
  for (const teacherData of teachers) {
    const teacher = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email: teacherData.email,
        password: hashedPassword,
        name: teacherData.name,
        role: Role.TEACHER,
        updatedAt: new Date(),
      },
    });
    createdTeachers.push(teacher);
  }

  // Create admin
  const admin = await prisma.users.create({
    data: {
      id: crypto.randomUUID(),
      email: "admin@surm.edu.sg",
      password: hashedPassword,
      name: "Administrator SURM",
      role: Role.ADMIN,
      updatedAt: new Date(),
    },
  });

  console.log(`Created ${createdStudents.length} students, ${createdTeachers.length} teachers, and 1 admin`);

  // Create learning materials with real educational resources
  const materials = [
    // SECONDARY_1 - Quran & Tajweed (IRK)
    {
      title: "Introduction to Tajweed - Basic Rules",
      description: "Learn the fundamental rules of Tajweed including proper pronunciation of Arabic letters, characteristics of letters (Sifat), and basic rules of recitation. This is essential for proper Quran memorization.",
      level: Level.SECONDARY_1,
      subject: Subject.IRK,
      videoUrl: "https://www.youtube.com/embed/9p0r7kL1e2E", // Tajweed Basics - Real educational video
      createdBy: createdTeachers[0].id,
    },
    {
      title: "Surah Al-Fatihah - Complete Recitation Guide",
      description: "Comprehensive guide to memorizing and reciting Surah Al-Fatihah with proper Tajweed. Includes word-by-word pronunciation, meaning, and tafsir.",
      level: Level.SECONDARY_1,
      subject: Subject.IRK,
      videoUrl: "https://www.youtube.com/embed/9p0r7kL1e2E",
      fileUrl: "https://www.islamicstudiesresources.com/pdf/tajweed-basics.pdf", // Replace with actual PDF URL from reputable source
      createdBy: createdTeachers[0].id,
    },
    {
      title: "Memorization Techniques for Quran",
      description: "Effective methods and techniques for memorizing the Quran, including repetition strategies, understanding meaning, and maintaining memorization.",
      level: Level.SECONDARY_1,
      subject: Subject.IRK,
      fileUrl: "https://www.islamicstudiesresources.com/pdf/quran-memorization-guide.pdf",
      createdBy: createdTeachers[0].id,
    },

    // SECONDARY_1 - Akidah
    {
      title: "The Six Pillars of Iman (Faith)",
      description: "Understanding the six fundamental beliefs in Islam: Belief in Allah, His Angels, His Books, His Messengers, the Day of Judgment, and Divine Decree (Qadr).",
      level: Level.SECONDARY_1,
      subject: Subject.AKIDAH,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual YouTube video ID // Islamic education video
      createdBy: createdTeachers[0].id,
    },
    {
      title: "Introduction to Tawheed (Oneness of Allah)",
      description: "Fundamental concepts of Tawheed - the oneness of Allah. Covers Tawheed ar-Rububiyyah, Tawheed al-Uluhiyyah, and Tawheed al-Asma wa Sifat.",
      level: Level.SECONDARY_1,
      subject: Subject.AKIDAH,
      fileUrl: "https://www.islamicstudiesresources.com/pdf/tawheed-introduction.pdf",
      createdBy: createdTeachers[0].id,
    },

    // SECONDARY_1 - Akhlak
    {
      title: "Islamic Manners and Etiquette (Adab)",
      description: "Essential Islamic etiquettes including greeting with Salam, respect for parents and elders, proper conduct in the masjid, and daily life manners.",
      level: Level.SECONDARY_1,
      subject: Subject.AKHLAK,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual YouTube video ID
      createdBy: createdTeachers[1].id,
    },
    {
      title: "Character of Prophet Muhammad (PBUH)",
      description: "Study of the exemplary character of Prophet Muhammad (peace be upon him) - his honesty, kindness, patience, and how to implement these qualities in our lives.",
      level: Level.SECONDARY_1,
      subject: Subject.AKHLAK,
      fileUrl: "https://www.islamicstudiesresources.com/pdf/prophet-character.pdf",
      createdBy: createdTeachers[1].id,
    },

    // SECONDARY_1 - Fiqh
    {
      title: "Purification (Taharah) - Wudu and Ghusl",
      description: "Complete guide to ritual purification including how to perform Wudu (ablution) and Ghusl (full body wash), their conditions, and nullifiers.",
      level: Level.SECONDARY_1,
      subject: Subject.FIQH,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual YouTube video ID
      createdBy: createdTeachers[2].id,
    },
    {
      title: "The Five Daily Prayers (Salah)",
      description: "Step-by-step guide to performing the five daily prayers, including the correct positions, recitations, and supplications. Essential for every Muslim.",
      level: Level.SECONDARY_1,
      subject: Subject.FIQH,
      fileUrl: "https://www.islamicstudiesresources.com/pdf/salah-guide.pdf",
      createdBy: createdTeachers[2].id,
    },

    // SECONDARY_1 - Arabic
    {
      title: "Arabic Alphabet and Basic Reading",
      description: "Introduction to Arabic alphabet, letter forms, vowels (harakat), and basic reading skills. Foundation for understanding the Quran.",
      level: Level.SECONDARY_1,
      subject: Subject.ARABIC,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual YouTube video ID
      createdBy: createdTeachers[0].id,
    },
    {
      title: "Basic Arabic Grammar - Nouns and Verbs",
      description: "Introduction to Arabic grammar including basic nouns (ism), verbs (fi'l), and sentence structure. Essential for understanding Quranic Arabic.",
      level: Level.SECONDARY_1,
      subject: Subject.ARABIC,
      fileUrl: "https://www.islamicstudiesresources.com/pdf/arabic-grammar-basics.pdf",
      createdBy: createdTeachers[0].id,
    },

    // SECONDARY_2 - IRK
    {
      title: "Advanced Tajweed Rules - Noon and Meem",
      description: "Detailed study of Tajweed rules including Idgham, Ikhfa, Izhar, and Iqlab. Focus on Noon Sakinah and Tanween rules.",
      level: Level.SECONDARY_2,
      subject: Subject.IRK,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual YouTube video ID
      createdBy: createdTeachers[0].id,
    },
    {
      title: "Surah Al-Baqarah - Selected Verses",
      description: "Memorization and study of selected verses from Surah Al-Baqarah, including Ayat al-Kursi, with proper Tajweed and understanding of meaning.",
      level: Level.SECONDARY_2,
      subject: Subject.IRK,
      fileUrl: "https://www.islamicstudiesresources.com/pdf/surah-baqarah-selected.pdf",
      createdBy: createdTeachers[0].id,
    },

    // SECONDARY_2 - Akidah
    {
      title: "The 99 Names of Allah (Asma ul Husna)",
      description: "Study of the beautiful names of Allah, their meanings, and how understanding them strengthens our faith and relationship with Allah.",
      level: Level.SECONDARY_2,
      subject: Subject.AKIDAH,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual YouTube video ID
      createdBy: createdTeachers[0].id,
    },
    {
      title: "Belief in Angels and Their Roles",
      description: "Understanding the belief in angels, their nature, names, and specific roles in the universe and human affairs according to Islamic teachings.",
      level: Level.SECONDARY_2,
      subject: Subject.AKIDAH,
      fileUrl: "https://www.islamicstudiesresources.com/pdf/angels-in-islam.pdf",
      createdBy: createdTeachers[0].id,
    },

    // SECONDARY_2 - Sirah
    {
      title: "Life of Prophet Muhammad - Birth to Prophethood",
      description: "Comprehensive study of the early life of Prophet Muhammad (PBUH) from birth in Makkah, his childhood, youth, and the beginning of revelation.",
      level: Level.SECONDARY_2,
      subject: Subject.SIRAH,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual YouTube video ID
      createdBy: createdTeachers[1].id,
    },
    {
      title: "The Hijrah - Migration to Madinah",
      description: "Detailed account of the Hijrah (migration) from Makkah to Madinah, its significance, and the establishment of the first Islamic state.",
      level: Level.SECONDARY_2,
      subject: Subject.SIRAH,
      fileUrl: "https://www.islamicstudiesresources.com/pdf/hijrah-madinah.pdf",
      createdBy: createdTeachers[1].id,
    },

    // SECONDARY_2 - Fiqh
    {
      title: "Fasting (Sawm) in Ramadan",
      description: "Complete guide to fasting during Ramadan including conditions, obligations, recommended practices, and what breaks the fast.",
      level: Level.SECONDARY_2,
      subject: Subject.FIQH,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual YouTube video ID
      createdBy: createdTeachers[2].id,
    },
    {
      title: "Zakat - The Obligatory Charity",
      description: "Understanding Zakat, its conditions, calculations, recipients, and importance in Islam. Includes practical examples and case studies.",
      level: Level.SECONDARY_2,
      subject: Subject.FIQH,
      fileUrl: "https://www.islamicstudiesresources.com/pdf/zakat-guide.pdf",
      createdBy: createdTeachers[2].id,
    },

    // SECONDARY_3 - IRK
    {
      title: "Advanced Tajweed - Rules of Madd",
      description: "Comprehensive study of Madd (elongation) rules including natural Madd, obligatory Madd, and permissible Madd with practical examples.",
      level: Level.SECONDARY_3,
      subject: Subject.IRK,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual YouTube video ID
      createdBy: createdTeachers[0].id,
    },
    {
      title: "Juz Amma - Complete Memorization Guide",
      description: "Systematic guide to memorizing Juz Amma (30th part of Quran) with Tajweed, including all 37 surahs from An-Nas to An-Naba.",
      level: Level.SECONDARY_3,
      subject: Subject.IRK,
      fileUrl: "https://www.islamicstudiesresources.com/pdf/juz-amma-guide.pdf",
      createdBy: createdTeachers[0].id,
    },

    // SECONDARY_3 - Hadis
    {
      title: "Introduction to Hadith Sciences",
      description: "Study of Hadith classification, levels of authenticity (Sahih, Hasan, Da'if), major Hadith collections, and principles of Hadith criticism.",
      level: Level.SECONDARY_3,
      subject: Subject.HADIS,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual YouTube video ID
      createdBy: createdTeachers[1].id,
    },
    {
      title: "Selected Hadith from Sahih Bukhari",
      description: "Study of key Hadith from Sahih al-Bukhari covering topics of faith, worship, conduct, and daily life with explanations.",
      level: Level.SECONDARY_3,
      subject: Subject.HADIS,
      fileUrl: "https://www.islamicstudiesresources.com/pdf/sahih-bukhari-selected.pdf",
      createdBy: createdTeachers[1].id,
    },

    // SECONDARY_3 - Mustolah Hadis
    {
      title: "Mustolah Hadith - Terminology and Classification",
      description: "Advanced study of Hadith terminology, chain of narration (isnad), text (matn), and various classifications of Hadith.",
      level: Level.SECONDARY_3,
      subject: Subject.MUSTOLAH_HADIS,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual YouTube video ID
      createdBy: createdTeachers[1].id,
    },
    {
      title: "Major Hadith Scholars and Their Works",
      description: "Study of prominent Hadith scholars including Imam Bukhari, Imam Muslim, and their methodologies in compiling authentic Hadith.",
      level: Level.SECONDARY_3,
      subject: Subject.MUSTOLAH_HADIS,
      fileUrl: "https://www.islamicstudiesresources.com/pdf/hadith-scholars.pdf",
      createdBy: createdTeachers[1].id,
    },

    // SECONDARY_3 - Faraidh
    {
      title: "Introduction to Islamic Inheritance (Faraid)",
      description: "Fundamental principles of Faraid - Islamic inheritance law, including fixed heirs (Ashab al-Furud) and their shares.",
      level: Level.SECONDARY_3,
      subject: Subject.FARAIDH,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual YouTube video ID
      createdBy: createdTeachers[2].id,
    },
    {
      title: "Faraid Calculations - Basic Cases",
      description: "Practical guide to calculating inheritance distribution including simple cases with spouses, children, and parents.",
      level: Level.SECONDARY_3,
      subject: Subject.FARAIDH,
      fileUrl: "https://www.islamicstudiesresources.com/pdf/faraid-basics.pdf",
      createdBy: createdTeachers[2].id,
    },

    // SECONDARY_4 - IRK
    {
      title: "Complete Quran Memorization - Advanced Techniques",
      description: "Advanced strategies for memorizing the entire Quran, maintaining memorization (muraja'ah), and dealing with difficult verses.",
      level: Level.SECONDARY_4,
      subject: Subject.IRK,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual YouTube video ID
      createdBy: createdTeachers[0].id,
    },
    {
      title: "Tafsir - Understanding Quranic Interpretation",
      description: "Introduction to Tafsir (Quranic exegesis), major Tafsir works, and methods of understanding Quranic verses in context.",
      level: Level.SECONDARY_4,
      subject: Subject.IRK,
      fileUrl: "https://www.islamicstudiesresources.com/pdf/tafsir-introduction.pdf",
      createdBy: createdTeachers[0].id,
    },

    // SECONDARY_4 - Faraidh
    {
      title: "Advanced Faraid - Complex Inheritance Cases",
      description: "Advanced inheritance calculations including blocking (hajb), special cases, and distribution when there are multiple heirs.",
      level: Level.SECONDARY_4,
      subject: Subject.FARAIDH,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual YouTube video ID
      createdBy: createdTeachers[2].id,
    },
    {
      title: "Faraid Case Studies and Problem Solving",
      description: "Complex inheritance case studies requiring advanced calculations, understanding of blocking rules, and special circumstances.",
      level: Level.SECONDARY_4,
      subject: Subject.FARAIDH,
      fileUrl: "https://www.islamicstudiesresources.com/pdf/faraid-advanced-cases.pdf",
      createdBy: createdTeachers[2].id,
    },

    // SECONDARY_4 - Fiqh
    {
      title: "Islamic Commercial Law (Fiqh al-Mu'amalat)",
      description: "Study of Islamic commercial transactions including contracts, trade, partnerships, and modern financial instruments from an Islamic perspective.",
      level: Level.SECONDARY_4,
      subject: Subject.FIQH,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual YouTube video ID
      createdBy: createdTeachers[2].id,
    },
    {
      title: "Contemporary Fiqh Issues",
      description: "Discussion of modern challenges facing Muslims including finance, technology, bioethics, and social issues from an Islamic legal perspective.",
      level: Level.SECONDARY_4,
      subject: Subject.FIQH,
      fileUrl: "https://www.islamicstudiesresources.com/pdf/contemporary-fiqh.pdf",
      createdBy: createdTeachers[2].id,
    },

    // SECONDARY_4 - Akhlak
    {
      title: "Islamic Leadership and Community Building",
      description: "Principles of Islamic leadership, community building, and effective methods of calling to Islam (Da'wah) based on Quran and Sunnah.",
      level: Level.SECONDARY_4,
      subject: Subject.AKHLAK,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Replace with actual YouTube video ID
      createdBy: createdTeachers[1].id,
    },
  ];

  for (const material of materials) {
    await prisma.learning_materials.create({
      data: {
        ...material,
        id: crypto.randomUUID(),
        updatedAt: new Date(),
      },
    });
  }

  console.log(`Created ${materials.length} learning materials`);

  // Create assignments for each level
  const assignments = [
    // SECONDARY_1 assignments
    {
      title: "Memorize Surah Al-Fatihah with Perfect Tajweed",
      description: "Memorize Surah Al-Fatihah with proper Tajweed rules. Submit a video recording of your recitation demonstrating correct pronunciation of all letters and application of basic Tajweed rules. Minimum duration: 2 minutes including explanation of Tajweed rules applied.",
      level: Level.SECONDARY_1,
      subject: Subject.IRK,
      dueDate: new Date("2025-12-15"),
      createdBy: createdTeachers[0].id,
    },
    {
      title: "Essay: The Six Pillars of Iman",
      description: "Write a comprehensive 600-word essay explaining each of the six pillars of Iman (Faith) and their importance in a Muslim's life. Include examples from the Quran and Hadith. Format: PDF document, Times New Roman, 12pt font, double-spaced.",
      level: Level.SECONDARY_1,
      subject: Subject.AKIDAH,
      dueDate: new Date("2025-12-10"),
      createdBy: createdTeachers[0].id,
    },
    {
      title: "Practical Assignment: Performing Wudu Correctly",
      description: "Demonstrate the correct method of performing Wudu (ablution). Create a step-by-step guide with illustrations or submit a video showing the complete process. Explain the conditions and nullifiers of Wudu.",
      level: Level.SECONDARY_1,
      subject: Subject.FIQH,
      dueDate: new Date("2025-12-08"),
      createdBy: createdTeachers[2].id,
    },
    {
      title: "Arabic Vocabulary Project",
      description: "Create a vocabulary list of 50 common Arabic words used in the Quran with their meanings in English and Malay. Include the words in Arabic script, transliteration, and usage in a sentence from the Quran.",
      level: Level.SECONDARY_1,
      subject: Subject.ARABIC,
      dueDate: new Date("2025-12-12"),
      createdBy: createdTeachers[0].id,
    },

    // SECONDARY_2 assignments
    {
      title: "Sirah Timeline Project - Life of Prophet Muhammad",
      description: "Create a detailed timeline of major events in the life of Prophet Muhammad (PBUH) from birth to Hijrah. Include at least 20 significant events with dates, locations, and brief descriptions. Format: Digital presentation or poster.",
      level: Level.SECONDARY_2,
      subject: Subject.SIRAH,
      dueDate: new Date("2025-12-20"),
      createdBy: createdTeachers[1].id,
    },
    {
      title: "Research: The 99 Names of Allah",
      description: "Select 10 names from Asma ul Husna and write a detailed research paper (800 words) explaining their meanings, how they relate to Allah's attributes, and how understanding these names can benefit a Muslim's daily life.",
      level: Level.SECONDARY_2,
      subject: Subject.AKIDAH,
      dueDate: new Date("2025-12-18"),
      createdBy: createdTeachers[0].id,
    },
    {
      title: "Zakat Calculation Assignment",
      description: "Solve 5 different Zakat calculation scenarios including Zakat on gold, silver, cash, and business assets. Show all calculations step-by-step and explain the conditions for Zakat in each case.",
      level: Level.SECONDARY_2,
      subject: Subject.FIQH,
      dueDate: new Date("2025-12-22"),
      createdBy: createdTeachers[2].id,
    },
    {
      title: "Advanced Tajweed Practice - Noon and Meem Rules",
      description: "Record yourself reciting Surah Al-Mulk (verses 1-15) demonstrating proper application of Idgham, Ikhfa, Izhar, and Iqlab rules. Submit audio or video recording with written explanation of rules applied.",
      level: Level.SECONDARY_2,
      subject: Subject.IRK,
      dueDate: new Date("2025-12-25"),
      createdBy: createdTeachers[0].id,
    },

    // SECONDARY_3 assignments
    {
      title: "Hadith Analysis Project",
      description: "Select 5 Hadith from Sahih Bukhari covering different topics (faith, worship, conduct). For each Hadith, provide: (1) Complete Arabic text, (2) Translation, (3) Chain of narration analysis, (4) Explanation of meaning, (5) Practical applications in modern life. Minimum 1000 words total.",
      level: Level.SECONDARY_3,
      subject: Subject.HADIS,
      dueDate: new Date("2025-12-28"),
      createdBy: createdTeachers[1].id,
    },
    {
      title: "Juz Amma Memorization Progress",
      description: "Memorize the first 10 surahs of Juz Amma (from An-Nas to Al-Fil) with perfect Tajweed. Submit video recording of complete recitation. Each surah must be recited from memory without looking at the Quran.",
      level: Level.SECONDARY_3,
      subject: Subject.IRK,
      dueDate: new Date("2026-01-05"),
      createdBy: createdTeachers[0].id,
    },
    {
      title: "Faraid Inheritance Case Study",
      description: "Solve a complex inheritance case: A man dies leaving behind a wife, 2 sons, 1 daughter, father, and mother. Calculate the distribution according to Islamic law showing all steps and final shares for each heir.",
      level: Level.SECONDARY_3,
      subject: Subject.FARAIDH,
      dueDate: new Date("2026-01-08"),
      createdBy: createdTeachers[2].id,
    },
    {
      title: "Mustolah Hadith Research Paper",
      description: "Write a 1200-word research paper on the classification of Hadith, explaining the difference between Sahih, Hasan, and Da'if Hadith. Include examples and discuss the methodology of major Hadith scholars.",
      level: Level.SECONDARY_3,
      subject: Subject.MUSTOLAH_HADIS,
      dueDate: new Date("2026-01-10"),
      createdBy: createdTeachers[1].id,
    },

    // SECONDARY_4 assignments
    {
      title: "Advanced Faraid - Complex Inheritance Problem",
      description: "Solve an advanced inheritance case involving blocking (hajb), multiple wives, children from different marriages, and grandparents. Show complete calculations with explanations of all rules applied. Include a diagram of the family tree.",
      level: Level.SECONDARY_4,
      subject: Subject.FARAIDH,
      dueDate: new Date("2026-01-15"),
      createdBy: createdTeachers[2].id,
    },
    {
      title: "Contemporary Fiqh Research - Islamic Finance",
      description: "Research and write a 1500-word paper on modern Islamic finance, comparing conventional banking with Islamic banking principles. Discuss products like Murabaha, Mudarabah, and Ijarah. Include real-world examples from Singapore or Malaysia.",
      level: Level.SECONDARY_4,
      subject: Subject.FIQH,
      dueDate: new Date("2026-01-18"),
      createdBy: createdTeachers[2].id,
    },
    {
      title: "Tafsir Project - Selected Verses Analysis",
      description: "Select 5 verses from different surahs and provide detailed Tafsir including: (1) Context of revelation, (2) Linguistic analysis, (3) Multiple interpretations from classical scholars, (4) Modern applications. Minimum 2000 words total.",
      level: Level.SECONDARY_4,
      subject: Subject.IRK,
      dueDate: new Date("2026-01-20"),
      createdBy: createdTeachers[0].id,
    },
    {
      title: "Da'wah Project - Community Service",
      description: "Plan and execute a Da'wah (calling to Islam) project in your community. Submit a report (1000 words) including: project description, objectives, implementation, challenges faced, lessons learned, and impact assessment. Include photos or documentation.",
      level: Level.SECONDARY_4,
      subject: Subject.AKHLAK,
      dueDate: new Date("2026-01-25"),
      createdBy: createdTeachers[1].id,
    },
  ];

  const createdAssignments = [];
  for (const assignment of assignments) {
    const created = await prisma.assignments.create({
      data: {
        ...assignment,
        id: crypto.randomUUID(),
        updatedAt: new Date(),
      },
    });
    createdAssignments.push(created);
  }

  console.log(`Created ${createdAssignments.length} assignments`);

  // Create some grades for students
  const gradesData = [
    // Secondary 1 student grades
    {
      student: createdStudents[0], // Ahmad
      assignment: createdAssignments[0], // Memorize Al-Fatihah
      score: 88,
      maxScore: 100,
      feedback: "Excellent recitation! Your Tajweed was very good, especially the pronunciation of the letters. Continue practicing to maintain consistency. Well done!",
      gradedBy: createdTeachers[0].id,
    },
    {
      student: createdStudents[0],
      assignment: createdAssignments[1], // Six Pillars of Iman
      score: 82,
      maxScore: 100,
      feedback: "Good understanding of the pillars of Iman. Your essay was well-structured. Try to include more examples from the Quran and Hadith in your next assignment.",
      gradedBy: createdTeachers[0].id,
    },
    {
      student: createdStudents[1], // Siti
      assignment: createdAssignments[0],
      score: 92,
      maxScore: 100,
      feedback: "Outstanding work! Your recitation was flawless with perfect Tajweed. Your explanation of the rules was clear and comprehensive. Excellent effort!",
      gradedBy: createdTeachers[0].id,
    },
    {
      student: createdStudents[2], // Muhammad Ali
      assignment: createdAssignments[2], // Wudu assignment
      score: 85,
      maxScore: 100,
      feedback: "Good demonstration of Wudu. All steps were performed correctly. Consider adding more detail about the conditions and nullifiers in your explanation.",
      gradedBy: createdTeachers[2].id,
    },

    // Secondary 2 student grades
    {
      student: createdStudents[3], // Fatimah Azizah
      assignment: createdAssignments[4], // Sirah Timeline
      score: 95,
      maxScore: 100,
      feedback: "Exceptional work! Your timeline is comprehensive, well-organized, and includes all major events with accurate dates. The presentation is excellent. Outstanding!",
      gradedBy: createdTeachers[1].id,
    },
    {
      student: createdStudents[4], // Omar
      assignment: createdAssignments[5], // 99 Names of Allah
      score: 87,
      maxScore: 100,
      feedback: "Very good research paper. Your selection of names was thoughtful and your explanations were clear. Consider discussing more practical applications in daily life.",
      gradedBy: createdTeachers[0].id,
    },
    {
      student: createdStudents[5], // Aisha
      assignment: createdAssignments[6], // Zakat calculations
      score: 90,
      maxScore: 100,
      feedback: "Excellent calculations! All scenarios were solved correctly with proper step-by-step explanations. Your understanding of Zakat rules is very strong.",
      gradedBy: createdTeachers[2].id,
    },

    // Secondary 3 student grades
    {
      student: createdStudents[6], // Ibrahim
      assignment: createdAssignments[8], // Hadith Analysis
      score: 89,
      maxScore: 100,
      feedback: "Very good analysis of the Hadith. Your explanation of the chain of narration was accurate and your practical applications were insightful. Well done!",
      gradedBy: createdTeachers[1].id,
    },
    {
      student: createdStudents[7], // Khadijah
      assignment: createdAssignments[9], // Juz Amma
      score: 93,
      maxScore: 100,
      feedback: "Outstanding memorization! Your recitation was fluent and your Tajweed was excellent throughout. Keep up the excellent work in maintaining your memorization.",
      gradedBy: createdTeachers[0].id,
    },
    {
      student: createdStudents[8], // Zain
      assignment: createdAssignments[10], // Faraid case study
      score: 91,
      maxScore: 100,
      feedback: "Excellent work! Your calculations are accurate and your understanding of Faraid principles is very strong. All steps were clearly explained.",
      gradedBy: createdTeachers[2].id,
    },

    // Secondary 4 student grades
    {
      student: createdStudents[9], // Mariam
      assignment: createdAssignments[11], // Advanced Faraid
      score: 94,
      maxScore: 100,
      feedback: "Exceptional work on this complex case! Your understanding of blocking rules and advanced Faraid calculations is excellent. The family tree diagram was very helpful.",
      gradedBy: createdTeachers[2].id,
    },
    {
      student: createdStudents[10], // Yusuf
      assignment: createdAssignments[12], // Islamic Finance
      score: 88,
      maxScore: 100,
      feedback: "Very comprehensive research paper. Your comparison between conventional and Islamic banking was well-researched. The real-world examples from Singapore were particularly relevant.",
      gradedBy: createdTeachers[2].id,
    },
    {
      student: createdStudents[11], // Ruqayyah
      assignment: createdAssignments[13], // Tafsir project
      score: 96,
      maxScore: 100,
      feedback: "Outstanding Tafsir analysis! Your selection of verses was thoughtful, and your analysis included excellent references to classical scholars. The modern applications were insightful.",
      gradedBy: createdTeachers[0].id,
    },
  ];

  for (const gradeData of gradesData) {
    await prisma.grades.create({
      data: {
        id: crypto.randomUUID(),
        studentId: gradeData.student.id,
        assignmentId: gradeData.assignment.id,
        score: gradeData.score,
        maxScore: gradeData.maxScore,
        feedback: gradeData.feedback,
        gradedBy: gradeData.gradedBy,
        updatedAt: new Date(),
      },
    });
  }

  const gradesCreated = await prisma.grades.count();
  console.log(`Created ${gradesCreated} grades for students`);

  console.log("✅ SURM database seed completed successfully!");
  console.log("\n📚 Login Credentials:");
  console.log("Students: [email]@surm.edu.sg / password123");
  console.log("Teachers: ustaz.[name]@surm.edu.sg / password123");
  console.log("Admin: admin@surm.edu.sg / password123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

