import { Platform, TextStyle } from 'react-native';

/**
 * Cross-platform font families. We rely on the system UI font on each platform
 * to keep the bundle light and the rendering native. Swap these out for a
 * custom font later by registering it in the native projects and updating the
 * values below.
 */
export const fontFamily = {
  regular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  medium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  semibold: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  bold: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
  display: 44,
} as const;

/**
 * Named text variants used by the <Typography /> component. Each variant is a
 * complete TextStyle so screens can stay declarative.
 */
export const textVariants = {
  display: {
    fontSize: fontSize.display,
    lineHeight: fontSize.display * 1.1,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.2,
  },
  h1: {
    fontSize: fontSize.xxxl,
    lineHeight: fontSize.xxxl * 1.2,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.2,
  },
  h2: {
    fontSize: fontSize.xxl,
    lineHeight: fontSize.xxl * 1.25,
    fontWeight: fontWeight.bold,
  },
  h3: {
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * 1.3,
    fontWeight: fontWeight.semibold,
  },
  title: {
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * 1.35,
    fontWeight: fontWeight.semibold,
  },
  body: {
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.5,
    fontWeight: fontWeight.regular,
  },
  bodyStrong: {
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.5,
    fontWeight: fontWeight.semibold,
  },
  callout: {
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.45,
    fontWeight: fontWeight.medium,
  },
  caption: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.4,
    fontWeight: fontWeight.regular,
  },
  overline: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.4,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  button: {
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.2,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof textVariants;

export const typography = {
  fontFamily,
  fontWeight,
  fontSize,
  variants: textVariants,
} as const;

export type Typography = typeof typography;
