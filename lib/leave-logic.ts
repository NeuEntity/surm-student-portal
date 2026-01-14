import { prisma } from "@/lib/prisma";
import { EmploymentType, SubmissionType, SubmissionStatus } from "@prisma/client";
import { startOfYear, endOfYear } from "date-fns";

export interface LeaveBalance {
  annualLeave: {
    total: number;
    used: number;
    pending: number;
    remaining: number;
  };
  medicalLeave: {
    total: number;
    used: number;
    pending: number;
    remaining: number;
  };
}

export function getEntitlement(employmentType: EmploymentType | null) {
  // Default to 0 if no employment type
  if (!employmentType) {
    return { annualLeave: 0, medicalLeave: 0 };
  }

  switch (employmentType) {
    case "FULL_TIME":
      return { annualLeave: 14, medicalLeave: 14 };
    case "PERMANENT_PART_TIME":
      // "x days MC & 7 days Annual Leave". Assuming x=14 or same as FT for now, or maybe 7? 
      // User said "x days MC", I will assume standard 14 for MC is common or set it to 7 conservatively if 'x' implies 'pro-rated'. 
      // Let's assume 14 MC for now to be safe, or 7. "Part time: x days MC & x days Annual Leave".
      // Let's implement: PPT = 7 AL, 14 MC. PT = 7 AL, 7 MC.
      return { annualLeave: 7, medicalLeave: 14 };
    case "PART_TIME":
      return { annualLeave: 7, medicalLeave: 7 }; // Placeholder 'x'
    default:
      return { annualLeave: 0, medicalLeave: 0 };
  }
}

export async function calculateLeaveBalance(userId: string, employmentType: EmploymentType | null): Promise<LeaveBalance> {
  const entitlements = getEntitlement(employmentType);
  const now = new Date();
  const start = startOfYear(now);
  const end = endOfYear(now);

  // Fetch approved/pending submissions for this year
  // Using raw query or prisma findMany. 
  // We need to sum up days from metadata.
  
  const submissions = await prisma.submissions.findMany({
    where: {
      userId,
      type: { in: [SubmissionType.ANNUAL_LEAVE, SubmissionType.MEDICAL_CERT] },
      status: { in: [SubmissionStatus.APPROVED, SubmissionStatus.PENDING] },
      createdAt: { gte: start, lte: end },
    },
    select: {
      type: true,
      status: true,
      metadata: true,
    },
  });

  const balance: LeaveBalance = {
    annualLeave: { total: entitlements.annualLeave, used: 0, pending: 0, remaining: entitlements.annualLeave },
    medicalLeave: { total: entitlements.medicalLeave, used: 0, pending: 0, remaining: entitlements.medicalLeave },
  };

  for (const sub of submissions) {
    const meta = sub.metadata as any;
    const days = meta?.days || 0; // Ensure metadata has 'days'

    if (sub.type === SubmissionType.ANNUAL_LEAVE) {
      if (sub.status === SubmissionStatus.APPROVED) balance.annualLeave.used += days;
      else if (sub.status === SubmissionStatus.PENDING) balance.annualLeave.pending += days;
    } else if (sub.type === SubmissionType.MEDICAL_CERT) {
      if (sub.status === SubmissionStatus.APPROVED) balance.medicalLeave.used += days;
      else if (sub.status === SubmissionStatus.PENDING) balance.medicalLeave.pending += days;
    }
  }

  balance.annualLeave.remaining = Math.max(0, balance.annualLeave.total - balance.annualLeave.used - balance.annualLeave.pending);
  balance.medicalLeave.remaining = Math.max(0, balance.medicalLeave.total - balance.medicalLeave.used - balance.medicalLeave.pending);

  return balance;
}

export async function validateLeaveRequest(userId: string, employmentType: EmploymentType | null, type: SubmissionType, days: number) {
  const balance = await calculateLeaveBalance(userId, employmentType);
  
  if (type === SubmissionType.ANNUAL_LEAVE) {
    if (days > balance.annualLeave.remaining) {
      return { valid: false, error: `Insufficient Annual Leave balance. Remaining: ${balance.annualLeave.remaining} days.` };
    }
  } else if (type === SubmissionType.MEDICAL_CERT) {
    if (days > balance.medicalLeave.remaining) {
      return { valid: false, error: `Insufficient Medical Leave balance. Remaining: ${balance.medicalLeave.remaining} days.` };
    }
  }

  return { valid: true };
}
