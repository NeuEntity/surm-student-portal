import { PrismaClient, Role, Level, Subject, SubmissionType, SubmissionStatus, EmploymentType } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting comprehensive database seed for SURM...");

  // 1. Clean up existing data
  console.log("🧹 Clearing existing data...");
  await prisma.grades.deleteMany({});
  await prisma.submissions.deleteMany({});
  await prisma.assignments.deleteMany({});
  await prisma.learning_materials.deleteMany({});
  await prisma.users.deleteMany({});
  console.log("✅ Data cleared.");

  const hashedPassword = await bcrypt.hash("password123", 10);

  // 2. Create Users (Demo Accounts)
  console.log("bustCreating users...");
  
  // -- Students --
  const students = [
    {
      email: "student1@surm.edu",
      name: "Student One (Sec 1)",
      level: Level.SECONDARY_1,
      ic: "T1111111A",
      phone: "+65 8111 1111",
      parent: "Parent One",
      parentPhone: "+65 9111 1111",
      class: "Classroom 1"
    },
    {
      email: "student2@surm.edu",
      name: "Student Two (Sec 2)",
      level: Level.SECONDARY_2,
      ic: "T2222222B",
      phone: "+65 8222 2222",
      parent: "Parent Two",
      parentPhone: "+65 9222 2222",
      class: "Classroom 2"
    },
    {
      email: "student3@surm.edu",
      name: "Student Three (Sec 3)",
      level: Level.SECONDARY_3,
      ic: "T3333333C",
      phone: "+65 8333 3333",
      parent: "Parent Three",
      parentPhone: "+65 9333 3333",
      class: "Classroom 3"
    },
    {
      email: "student4@surm.edu",
      name: "Student Four (Sec 4)",
      level: Level.SECONDARY_4,
      ic: "T4444444D",
      phone: "+65 8444 4444",
      parent: "Parent Four",
      parentPhone: "+65 9444 4444",
      class: "Classroom 4"
    }
  ];

  const createdStudents: any = {};
  for (const s of students) {
    createdStudents[s.email] = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email: s.email,
        password: hashedPassword,
        name: s.name,
        role: Role.STUDENT,
        level: s.level,
        icNumber: s.ic,
        phoneNumber: s.phone,
        parentName: s.parent,
        parentPhone: s.parentPhone,
        className: s.class,
        updatedAt: new Date(),
      }
    });
  }

  // -- Teachers --
  const teachers = [
    {
      email: "teacher@surm.edu",
      name: "Ustaz Abdullah (Form & Tahfiz)",
      roles: ["FORM", "TAHFIZ"],
      classes: ["Classroom 1", "Halaqah 1"],
      type: EmploymentType.FULL_TIME
    },
    {
      email: "teacher.form@surm.edu",
      name: "Cikgu Siti (Form Only)",
      roles: ["FORM"],
      classes: ["Classroom 2"],
      type: EmploymentType.FULL_TIME
    },
    {
      email: "teacher.tahfiz@surm.edu",
      name: "Ustaz Yusuf (Tahfiz Only)",
      roles: ["TAHFIZ"],
      classes: ["Halaqah 2"],
      type: EmploymentType.PART_TIME
    },
    {
      email: "teacher.subject@surm.edu",
      name: "Mr. Tan (Subject Only)",
      roles: ["SUBJECT"],
      classes: ["Mathematics", "Science"],
      type: EmploymentType.PERMANENT_PART_TIME
    },
    {
      email: "principal@surm.edu.sg",
      name: "Principal Fauziah",
      roles: ["PRINCIPAL"],
      classes: [],
      type: EmploymentType.FULL_TIME
    }
  ];

  const createdTeachers: any = {};
  for (const t of teachers) {
    createdTeachers[t.email] = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email: t.email,
        password: hashedPassword,
        name: t.name,
        role: Role.TEACHER,
        teacherRoles: t.roles,
        classesTaught: t.classes,
        employmentType: t.type,
        updatedAt: new Date(),
      }
    });
  }

  // -- Admin --
  const admin = await prisma.users.create({
    data: {
      id: crypto.randomUUID(),
      email: "admin@surm.edu.sg",
      password: hashedPassword,
      name: "System Administrator",
      role: Role.ADMIN,
      updatedAt: new Date(),
    }
  });

  console.log("✅ Users created.");

  // 3. Create Learning Materials (Lesson Plans, Slides, etc.)
  // Using YouTube Embeds and reliable PDF links for better preview capability
  console.log("📚 Creating learning materials...");
  
  const materialsData = [
    // === SECONDARY 1 ===
    { 
      title: "Tajweed: Noon Sakinah Rules", 
      type: "Video", 
      level: Level.SECONDARY_1, 
      subject: Subject.IRK, 
      url: "https://www.youtube.com/embed/inpwu7t_qJI", // Tajweed Institute
      user: "teacher@surm.edu" 
    },
    { 
      title: "Introduction to Algebra", 
      type: "Video", 
      level: Level.SECONDARY_1, 
      subject: Subject.MATHS, 
      url: "https://www.youtube.com/embed/NybHckSEQBI", // Math Antics
      user: "teacher.subject@surm.edu" 
    },
    { 
      title: "Basic Arabic Grammar Notes", 
      type: "PDF", 
      level: Level.SECONDARY_1, 
      subject: Subject.ARABIC, 
      url: "https://www.kalamullah.com/Books/Arabic_Course_Vol_1.pdf", // Standard text
      user: "teacher@surm.edu" 
    },
    { 
      title: "English: Parts of Speech", 
      type: "Video", 
      level: Level.SECONDARY_1, 
      subject: Subject.ENGLISH, 
      url: "https://www.youtube.com/embed/0pQ47b7a660", 
      user: "teacher.form@surm.edu" 
    },
    { 
      title: "Bahasa Melayu: Tatabahasa", 
      type: "Video", 
      level: Level.SECONDARY_1, 
      subject: Subject.MALAY, 
      url: "https://www.youtube.com/embed/VideoID_BM1", 
      user: "teacher.form@surm.edu" 
    },

    // === SECONDARY 2 ===
    { 
      title: "Seerah: The Hijrah", 
      type: "Video", 
      level: Level.SECONDARY_2, 
      subject: Subject.SIRAH, 
      url: "https://www.youtube.com/embed/MeW0GDuuJVE", // Yasir Qadhi Seerah
      user: "teacher.form@surm.edu" 
    },
    { 
      title: "Maths: Factorisation", 
      type: "Video", 
      level: Level.SECONDARY_2, 
      subject: Subject.MATHS, 
      url: "https://www.youtube.com/embed/ZPz2h5n_Q2A", 
      user: "teacher.subject@surm.edu" 
    },
    { 
      title: "Fiqh: Fasting Rules", 
      type: "PDF", 
      level: Level.SECONDARY_2, 
      subject: Subject.FIQH, 
      url: "https://d1.islamhouse.com/data/en/ih_books/single/en_The_Fasting_of_Ramadan.pdf", 
      user: "teacher@surm.edu" 
    },
    { 
      title: "English: Narrative Writing", 
      type: "Video", 
      level: Level.SECONDARY_2, 
      subject: Subject.ENGLISH, 
      url: "https://www.youtube.com/embed/5YJtX7e8e8I", 
      user: "teacher.form@surm.edu" 
    },

    // === SECONDARY 3 ===
    { 
      title: "Faraid: Inheritance Basics", 
      type: "Video", 
      level: Level.SECONDARY_3, 
      subject: Subject.FARAIDH, 
      url: "https://www.youtube.com/embed/8y_8y_8y_8y", // Placeholder for specific Faraid video
      user: "teacher@surm.edu" 
    },
    { 
      title: "Hadith: 40 Nawawi Explanation", 
      type: "PDF", 
      level: Level.SECONDARY_3, 
      subject: Subject.HADIS, 
      url: "https://www.kalamullah.com/Books/Commentary_on_the_Forty_Hadith_of_Al-Nawawi.pdf", 
      user: "teacher@surm.edu" 
    },
    { 
      title: "Maths: Trigonometry", 
      type: "Video", 
      level: Level.SECONDARY_3, 
      subject: Subject.MATHS, 
      url: "https://www.youtube.com/embed/Pub0ebnGADk", 
      user: "teacher.subject@surm.edu" 
    },
    { 
      title: "Akidah: Qada and Qadar", 
      type: "Video", 
      level: Level.SECONDARY_3, 
      subject: Subject.AKIDAH, 
      url: "https://www.youtube.com/embed/VideoID_Aqidah", 
      user: "teacher@surm.edu" 
    },

    // === SECONDARY 4 ===
    { 
      title: "Islamic Finance: Riba", 
      type: "Video", 
      level: Level.SECONDARY_4, 
      subject: Subject.FIQH, 
      url: "https://www.youtube.com/embed/VideoID_Finance", 
      user: "principal@surm.edu.sg" 
    },
    { 
      title: "Ulum Quran: Revelation", 
      type: "PDF", 
      level: Level.SECONDARY_4, 
      subject: Subject.IRK, 
      url: "https://www.kalamullah.com/Books/An_Introduction_to_the_Sciences_of_the_Quran.pdf", 
      user: "teacher@surm.edu" 
    },
    { 
      title: "Maths: Differentiation", 
      type: "Video", 
      level: Level.SECONDARY_4, 
      subject: Subject.MATHS, 
      url: "https://www.youtube.com/embed/9vKqVkMqHKk", 
      user: "teacher.subject@surm.edu" 
    },
    { 
      title: "English: O-Level Essay Tips", 
      type: "Video", 
      level: Level.SECONDARY_4, 
      subject: Subject.ENGLISH, 
      url: "https://www.youtube.com/embed/VideoID_English", 
      user: "teacher.form@surm.edu" 
    }
  ];

  for (const m of materialsData) {
    await prisma.learning_materials.create({
      data: {
        id: crypto.randomUUID(),
        title: m.title,
        description: `Comprehensive ${m.type} for ${m.subject} students. Please review the attached material.`,
        level: m.level,
        subject: m.subject,
        fileUrl: m.type === "PDF" ? m.url : undefined,
        videoUrl: m.type === "Video" ? m.url : undefined,
        createdBy: createdTeachers[m.user].id,
        updatedAt: new Date(),
      }
    });
  }

  // 4. Create Assignments
  console.log("📝 Creating assignments...");

  const assignmentsData = [
    // Student 1 (Sec 1)
    { title: "Wudu Practical Video", subject: Subject.FIQH, level: Level.SECONDARY_1, user: "teacher@surm.edu", due: new Date(Date.now() + 86400000 * 7) }, 
    { title: "Algebra Quiz 1", subject: Subject.MATHS, level: Level.SECONDARY_1, user: "teacher.subject@surm.edu", due: new Date(Date.now() - 86400000 * 2) },
    { title: "English: Family Essay", subject: Subject.ENGLISH, level: Level.SECONDARY_1, user: "teacher.form@surm.edu", due: new Date(Date.now() + 86400000 * 5) },
    
    // Student 2 (Sec 2)
    { title: "Seerah Essay: Hijrah", subject: Subject.SIRAH, level: Level.SECONDARY_2, user: "teacher.form@surm.edu", due: new Date(Date.now() + 86400000 * 3) },
    { title: "Science Project: Plants", subject: Subject.MATHS, level: Level.SECONDARY_2, user: "teacher.subject@surm.edu", due: new Date(Date.now() + 86400000 * 10) },
    
    // Student 3 (Sec 3)
    { title: "Zakat Case Study", subject: Subject.FIQH, level: Level.SECONDARY_3, user: "teacher@surm.edu", due: new Date(Date.now() - 86400000 * 5) },
    { title: "Hadith Memorization", subject: Subject.HADIS, level: Level.SECONDARY_3, user: "teacher@surm.edu", due: new Date(Date.now() + 86400000 * 14) },
    
    // Student 4 (Sec 4)
    { title: "Islamic Banking Report", subject: Subject.FIQH, level: Level.SECONDARY_4, user: "principal@surm.edu.sg", due: new Date(Date.now() + 86400000 * 14) },
    { title: "Calculus Problem Set", subject: Subject.MATHS, level: Level.SECONDARY_4, user: "teacher.subject@surm.edu", due: new Date(Date.now() + 86400000 * 3) }
  ];

  const createdAssignments: any[] = [];
  for (const a of assignmentsData) {
    const assign = await prisma.assignments.create({
      data: {
        id: crypto.randomUUID(),
        title: a.title,
        description: "Complete the following task by the due date. Ensure all requirements are met.",
        subject: a.subject,
        level: a.level,
        dueDate: a.due,
        createdBy: createdTeachers[a.user].id,
        updatedAt: new Date(),
      }
    });
    createdAssignments.push(assign);
  }

  // 5. Create Submissions & Grades (Student Work)
  console.log("📤 Creating submissions and grades...");

  // S1: Algebra Quiz (Overdue, Submitted Late, Graded)
  const s1_assign = createdAssignments[1]; // Algebra
  const s1_user = createdStudents["student1@surm.edu"];
  await prisma.submissions.create({
    data: {
      id: crypto.randomUUID(),
      userId: s1_user.id,
      assignmentId: s1_assign.id,
      type: SubmissionType.ASSIGNMENT,
      fileUrl: "https://example.com/algebra_quiz_answers.pdf",
      status: SubmissionStatus.APPROVED,
      createdAt: new Date(Date.now() - 86400000), // Submitted yesterday (1 day late)
      updatedAt: new Date(),
    }
  });
  await prisma.grades.create({
    data: {
      id: crypto.randomUUID(),
      studentId: s1_user.id,
      assignmentId: s1_assign.id,
      score: 85,
      maxScore: 100,
      feedback: "Good effort, but watch out for sign errors in Question 3.",
      gradedBy: createdTeachers["teacher.subject@surm.edu"].id,
      updatedAt: new Date(),
    }
  });

  // S2: Seerah Essay (Submitted Early, Pending Grading)
  const s2_assign = createdAssignments[3]; // Seerah (Index 3 because added extra assign for S1)
  const s2_user = createdStudents["student2@surm.edu"];
  await prisma.submissions.create({
    data: {
      id: crypto.randomUUID(),
      userId: s2_user.id,
      assignmentId: s2_assign.id,
      type: SubmissionType.ASSIGNMENT,
      fileUrl: "https://example.com/hijrah_essay.docx",
      status: SubmissionStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });

  // 6. Create Administrative Submissions (Leaves, MCs, Letters)
  console.log("🏥 Creating administrative records (Leaves, MCs)...");

  // Teacher Leave (Approved)
  await prisma.submissions.create({
    data: {
      id: crypto.randomUUID(),
      userId: createdTeachers["teacher@surm.edu"].id,
      type: SubmissionType.ANNUAL_LEAVE,
      fileUrl: "https://example.com/leave_form.pdf",
      status: SubmissionStatus.APPROVED,
      metadata: { reason: "Family Vacation", startDate: "2025-06-10", endDate: "2025-06-15" },
      createdAt: new Date(Date.now() - 86400000 * 30),
      updatedAt: new Date(),
    }
  });

  // Teacher Leave (Pending)
  await prisma.submissions.create({
    data: {
      id: crypto.randomUUID(),
      userId: createdTeachers["teacher.form@surm.edu"].id,
      type: SubmissionType.ANNUAL_LEAVE,
      fileUrl: "https://example.com/urgent_leave.pdf",
      status: SubmissionStatus.PENDING,
      metadata: { reason: "Urgent Personal Matter", startDate: "2025-11-20", endDate: "2025-11-21" },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });

  // Student MC (Medical Cert)
  await prisma.submissions.create({
    data: {
      id: crypto.randomUUID(),
      userId: createdStudents["student4@surm.edu"].id,
      type: SubmissionType.MEDICAL_CERT,
      fileUrl: "https://example.com/mc_clinic.jpg",
      status: SubmissionStatus.APPROVED,
      metadata: { clinic: "Bedok Polyclinic", days: 2, issueDate: "2025-09-01" },
      createdAt: new Date(Date.now() - 86400000 * 10),
      updatedAt: new Date(),
    }
  });

  // Student Letter (Parent Letter)
  await prisma.submissions.create({
    data: {
      id: crypto.randomUUID(),
      userId: createdStudents["student1@surm.edu"].id,
      type: SubmissionType.LETTERS,
      fileUrl: "https://example.com/parent_letter.pdf",
      status: SubmissionStatus.PENDING,
      metadata: { subject: "Request for early dismissal on Friday", reason: "Medical appointment" },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });

  console.log("✅ Comprehensive seed completed!");
  console.log("   - Users: 4 Students, 5 Teachers, 1 Admin");
  console.log("   - Data: Assignments, Submissions (Graded/Pending), Leaves, MCs");
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
