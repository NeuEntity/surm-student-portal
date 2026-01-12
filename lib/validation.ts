export function validateRequiredText(value: string | undefined | null): boolean {
  return !!value && value.trim().length > 0;
}

export function validateICNumber(value: string | undefined | null): boolean {
  if (!value) return false;
  const v = value.trim();
  const numeric12 = /^\d{12}$/;
  const dashed = /^\d{6}-\d{2}-\d{4}$/;
  return numeric12.test(v) || dashed.test(v);
}

export function validateDateParts(day: string, month: string, year: string): boolean {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  if (y < 1900 || y > 2100) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}
