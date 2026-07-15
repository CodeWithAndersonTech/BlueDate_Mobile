/** Gender values stored as tinyint on user.gender */
export const Gender = {
  Men: 1,
  Woman: 2,
  Other: 3,
} as const;

export type GenderValue = (typeof Gender)[keyof typeof Gender];

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
