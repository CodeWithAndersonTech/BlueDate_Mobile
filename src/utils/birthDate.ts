export const MIN_REGISTER_AGE = 18;
export const MAX_REGISTER_AGE = 80;

export type BirthParts = {
  year: number;
  /** 1–12 */
  month: number;
  /** 1–31 */
  day: number;
};

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function clampDay(year: number, month: number, day: number): number {
  const max = daysInMonth(year, month);
  return Math.min(Math.max(1, day), max);
}

export function ageFromParts(parts: BirthParts, now = new Date()): number {
  let age = now.getFullYear() - parts.year;
  const month = now.getMonth() + 1;
  const day = now.getDate();
  if (
    month < parts.month ||
    (month === parts.month && day < parts.day)
  ) {
    age -= 1;
  }
  return age;
}

export function isValidRegisterAge(parts: BirthParts, now = new Date()): boolean {
  const age = ageFromParts(parts, now);
  return age >= MIN_REGISTER_AGE && age <= MAX_REGISTER_AGE;
}

/** YYYY-MM-DD for API */
export function formatBirthDateIso(parts: BirthParts): string {
  const yyyy = String(parts.year);
  const mm = String(parts.month).padStart(2, '0');
  const dd = String(parts.day).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Default DOB ≈ `years` ago (clamped day). */
export function defaultBirthParts(years = 25, now = new Date()): BirthParts {
  const year = now.getFullYear() - years;
  const month = now.getMonth() + 1;
  const day = clampDay(year, month, now.getDate());
  return { year, month, day };
}

export function yearRange(now = new Date()): { min: number; max: number } {
  const max = now.getFullYear() - MIN_REGISTER_AGE;
  const min = now.getFullYear() - MAX_REGISTER_AGE;
  return { min, max };
}
