/**
 * Corner radius scale. Card-heavy, "gaming console" UIs lean on generous
 * rounded corners, so the defaults here are intentionally soft.
 */
export const radii = {
  none: 0,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  pill: 999,
  round: 9999,
} as const;

export type Radii = typeof radii;
export type RadiiKey = keyof Radii;
