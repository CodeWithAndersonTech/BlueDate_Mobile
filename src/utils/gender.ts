/** Gender values stored as tinyint on user.gender */
export const Gender = {
  Men: 1,
  Woman: 2,
  Other: 3,
} as const;

export type GenderValue = (typeof Gender)[keyof typeof Gender];

export const GENDER_ALL: GenderValue[] = [
  Gender.Men,
  Gender.Woman,
  Gender.Other,
];

/**
 * Bitmask storage for user_filter_preference.show_me / visible_to.
 * Aligned with Gender codes: Men=1, Woman=2, Other=4, Everyone=7.
 */
export const GenderMask = {
  None: 0,
  Men: 1,
  Woman: 2,
  Other: 4,
  Everyone: 7,
} as const;

export const GENDER_OPTIONS: {
  value: GenderValue;
  labelKey: string;
}[] = [
  { value: Gender.Men, labelKey: 'gender.men' },
  { value: Gender.Woman, labelKey: 'gender.woman' },
  { value: Gender.Other, labelKey: 'gender.other' },
];

export function isValidGender(value: number | null | undefined): value is GenderValue {
  return value === Gender.Men || value === Gender.Woman || value === Gender.Other;
}

export function genderMaskFromCodes(codes: number[]): number {
  let mask = GenderMask.None;
  for (const code of codes) {
    if (code === Gender.Men) mask |= GenderMask.Men;
    else if (code === Gender.Woman) mask |= GenderMask.Woman;
    else if (code === Gender.Other) mask |= GenderMask.Other;
  }
  return mask;
}

export function genderCodesFromMask(mask: number): GenderValue[] {
  const codes: GenderValue[] = [];
  if (mask & GenderMask.Men) codes.push(Gender.Men);
  if (mask & GenderMask.Woman) codes.push(Gender.Woman);
  if (mask & GenderMask.Other) codes.push(Gender.Other);
  return codes;
}

export function isEveryoneCodes(codes: number[]): boolean {
  return GENDER_ALL.every(c => codes.includes(c));
}

/** UI chip key ↔ gender code (lgbt maps to Other=3). */
export const FILTER_CHIP_GENDER: Record<string, GenderValue> = {
  men: Gender.Men,
  women: Gender.Woman,
  lgbt: Gender.Other,
};

export function filterChipsToGenderCodes(chips: string[]): GenderValue[] {
  if (chips.includes('everyone')) {
    return [...GENDER_ALL];
  }
  const codes = chips
    .map(chip => FILTER_CHIP_GENDER[chip])
    .filter((c): c is GenderValue => c != null);
  return codes.length ? Array.from(new Set(codes)) : [Gender.Woman];
}

export function genderCodesToFilterChips(codes: number[]): string[] {
  if (isEveryoneCodes(codes)) {
    return ['everyone'];
  }
  const chips: string[] = [];
  if (codes.includes(Gender.Woman)) chips.push('women');
  if (codes.includes(Gender.Men)) chips.push('men');
  if (codes.includes(Gender.Other)) chips.push('lgbt');
  return chips.length ? chips : ['women'];
}
