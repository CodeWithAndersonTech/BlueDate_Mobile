/**
 * Primitive design tokens. Colors live in palette.ts; type scale in typography.ts.
 * Components read these through `theme.space` / `theme.radius` / `theme.components`.
 */

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 16,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

export const iconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 22,
  xl: 28,
} as const;

export const control = {
  inputHeight: 56,
  headerHeight: 56,
  iconButtonPad: 22,
  hairline: 1,
  border: 1.5,
} as const;

export const motion = {
  pressScale: 0.965,
  cardPressScale: 0.98,
  springIn: { damping: 16, stiffness: 340 },
  springOut: { damping: 13, stiffness: 260 },
  pressInMs: 90,
  pressOutMs: 160,
} as const;

export const layout = {
  screenPadding: space.xl,
  headerPadding: space.lg,
  sectionGap: space.lg,
} as const;
