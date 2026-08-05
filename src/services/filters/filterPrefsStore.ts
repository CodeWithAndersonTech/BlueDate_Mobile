import { appStorage } from '../../utils/appStorage';
import {
  FILTER_CHIP_GENDER,
  filterChipsToGenderCodes,
  GENDER_ALL,
  Gender,
  GenderValue,
  isValidGender,
} from '../../utils/gender';

export const FILTER_AGE_MIN = 18;
export const FILTER_AGE_MAX = 65;

export type FilterPrefs = {
  ageLow: number;
  ageHigh: number;
  /** Gender codes matching user.gender: 1=Men, 2=Woman, 3=Other */
  showMe: GenderValue[];
  /** Gender codes matching user.gender: 1=Men, 2=Woman, 3=Other */
  visibleTo: GenderValue[];
};

export const DEFAULT_FILTER_PREFS: FilterPrefs = {
  ageLow: 20,
  ageHigh: 40,
  showMe: [Gender.Woman],
  visibleTo: [...GENDER_ALL],
};

function storageKey(userId: number) {
  return `@bluedate/filter_prefs/${userId}`;
}

function clampAge(n: number) {
  return Math.min(FILTER_AGE_MAX, Math.max(FILTER_AGE_MIN, Math.round(n)));
}

function normalizeCodes(input: unknown, fallback: GenderValue[]): GenderValue[] {
  if (!Array.isArray(input) || input.length === 0) {
    return [...fallback];
  }

  // Legacy chip strings: women/men/lgbt/everyone
  if (typeof input[0] === 'string') {
    return filterChipsToGenderCodes(input as string[]);
  }

  const codes = (input as number[])
    .map(n => Number(n))
    .filter(isValidGender);
  return codes.length ? (Array.from(new Set(codes)) as GenderValue[]) : [...fallback];
}

export function normalizeFilterPrefs(
  input: Partial<FilterPrefs> | null | undefined,
): FilterPrefs {
  const ageLow = clampAge(input?.ageLow ?? DEFAULT_FILTER_PREFS.ageLow);
  const ageHigh = clampAge(input?.ageHigh ?? DEFAULT_FILTER_PREFS.ageHigh);

  return {
    ageLow: Math.min(ageLow, ageHigh),
    ageHigh: Math.max(ageLow, ageHigh),
    showMe: normalizeCodes(input?.showMe, DEFAULT_FILTER_PREFS.showMe),
    visibleTo: normalizeCodes(input?.visibleTo, DEFAULT_FILTER_PREFS.visibleTo),
  };
}

export async function loadLocalFilterPrefs(userId: number): Promise<FilterPrefs> {
  try {
    const raw = await appStorage.getItem(storageKey(userId));
    if (!raw) {
      return { ...DEFAULT_FILTER_PREFS, showMe: [...DEFAULT_FILTER_PREFS.showMe], visibleTo: [...DEFAULT_FILTER_PREFS.visibleTo] };
    }
    return normalizeFilterPrefs(JSON.parse(raw) as Partial<FilterPrefs>);
  } catch {
    return {
      ...DEFAULT_FILTER_PREFS,
      showMe: [...DEFAULT_FILTER_PREFS.showMe],
      visibleTo: [...DEFAULT_FILTER_PREFS.visibleTo],
    };
  }
}

export async function saveLocalFilterPrefs(
  userId: number,
  prefs: FilterPrefs,
): Promise<void> {
  const normalized = normalizeFilterPrefs(prefs);
  await appStorage.setItem(storageKey(userId), JSON.stringify(normalized));
}

export function chipSelected(codes: GenderValue[], chip: string): boolean {
  if (chip === 'everyone') {
    return GENDER_ALL.every(c => codes.includes(c));
  }
  const gender = FILTER_CHIP_GENDER[chip];
  return gender != null && codes.includes(gender);
}

export function toggleFilterChip(
  codes: GenderValue[],
  chip: string,
): GenderValue[] {
  if (chip === 'everyone') {
    return [...GENDER_ALL];
  }

  const gender = FILTER_CHIP_GENDER[chip];
  if (gender == null) {
    return codes;
  }

  const next = codes.includes(gender)
    ? codes.filter(c => c !== gender)
    : [...codes, gender];

  return next.length ? (Array.from(new Set(next)) as GenderValue[]) : [...GENDER_ALL];
}
