/**
 * 4pt-based spacing scale. Use these tokens instead of hard-coded numbers so
 * that layout stays consistent across screens and is easy to rescale later.
 */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 56,
  giant: 72,
} as const;

export type Spacing = typeof spacing;
export type SpacingKey = keyof Spacing;
