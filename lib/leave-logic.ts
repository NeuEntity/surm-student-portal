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
  childCareLeave: {
    total: number;
    used: number;
    pending: number;
    remaining: number;
  };
}

export function getEntitlement(employmentType: EmploymentType | null) {
  if (!employmentType) {
    return { annualLeave: 0, medicalLeave: 0, childCareLeave: 6 };
  }

  switch (employmentType) {
    case "FULL_TIME":
      return { annualLeave: 14, medicalLeave: 14, childCareLeave: 6 };
    case "PERMANENT_PART_TIME":
      return { annualLeave: 7, medicalLeave: 14, childCareLeave: 6 };
    case "PART_TIME":
      return { annualLeave: 7, medicalLeave: 7, childCareLeave: 6 };
    default:
      return { annualLeave: 0, medicalLeave: 0, childCareLeave: 6 };
  }
}

export async function calculateLeaveBalance(userId: string, employmentType: EmploymentType | null): Promise<LeaveBalance> {
  const entitlements = getEntitlement(employmentType);
  const now = new Date();
  const start = startOfYear(now);
  const end = endOfYear(now);

  const submissions = await prisma.submissions.findMany({
    where: {
      userId,
      type: { in: [SubmissionType.ANNUAL_LEAVE, SubmissionType.MEDICAL_CERT, SubmissionType.CHILD_CARE_LEAVE] },
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
    childCareLeave: { total: entitlements.childCareLeave, used: 0, pending: 0, remaining: entitlements.childCareLeave },
  };

  for (const sub of submissions) {
    const meta = sub.metadata as any;
    const days = meta?.days || 0;

    if (sub.type === SubmissionType.ANNUAL_LEAVE) {
      if (sub.status === SubmissionStatus.APPROVED) balance.annualLeave.used += days;
      else if (sub.status === SubmissionStatus.PENDING) balance.annualLeave.pending += days;
    } else if (sub.type === SubmissionType.MEDICAL_CERT) {
      if (sub.status === SubmissionStatus.APPROVED) balance.medicalLeave.used += days;
      else if (sub.status === SubmissionStatus.PENDING) balance.medicalLeave.pending += days;
    } else if (sub.type === SubmissionType.CHILD_CARE_LEAVE) {
      if (sub.status === SubmissionStatus.APPROVED) balance.childCareLeave.used += days;
      else if (sub.status === SubmissionStatus.PENDING) balance.childCareLeave.pending += days;
    }
  }

  balance.annualLeave.remaining = Math.max(0, balance.annualLeave.total - balance.annualLeave.used - balance.annualLeave.pending);
  balance.medicalLeave.remaining = Math.max(0, balance.medicalLeave.total - balance.medicalLeave.used - balance.medicalLeave.pending);
  balance.childCareLeave.remaining = Math.max(0, balance.childCareLeave.total - balance.childCareLeave.used - balance.childCareLeave.pending);

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
  } else if (type === SubmissionType.CHILD_CARE_LEAVE) {
    if (days > balance.childCareLeave.remaining) {
      return { valid: false, error: `Insufficient Child Care Leave balance. Remaining: ${balance.childCareLeave.remaining} days.` };
    }
  }

  return { valid: true };
}
