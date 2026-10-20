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

export function fontFamilyForWeight(
  weight: TextStyle['fontWeight'] | undefined,
): string {
  const w = String(weight ?? fontWeight.regular);
  if (w === '500') {
    return fontFamily.medium;
  }
  if (w === '600') {
    return fontFamily.semibold;
  }
  if (w === '700' || w === '800' || w === '900') {
    return fontFamily.bold;
  }
  return fontFamily.regular;
}

function variant(
  size: number,
  weight: TextStyle['fontWeight'],
  extras: TextStyle = {},
): TextStyle {
  return {
    fontFamily: fontFamilyForWeight(weight),
    fontSize: size,
    lineHeight: extras.lineHeight ?? size * 1.4,
    fontWeight: weight,
    ...extras,
  };
}

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
  display: variant(fontSize.display, fontWeight.heavy, {
    lineHeight: fontSize.display * 1.1,
    letterSpacing: 0.2,
  }),
  h1: variant(fontSize.xxxl, fontWeight.bold, {
    lineHeight: fontSize.xxxl * 1.2,
    letterSpacing: 0.2,
  }),
  h2: variant(fontSize.xxl, fontWeight.bold, {
    lineHeight: fontSize.xxl * 1.25,
  }),
  h3: variant(fontSize.xl, fontWeight.semibold, {
    lineHeight: fontSize.xl * 1.3,
  }),
  title: variant(fontSize.lg, fontWeight.semibold, {
    lineHeight: fontSize.lg * 1.35,
  }),
  body: variant(fontSize.base, fontWeight.regular, {
    lineHeight: fontSize.base * 1.5,
  }),
  bodyStrong: variant(fontSize.base, fontWeight.semibold, {
    lineHeight: fontSize.base * 1.5,
  }),
  callout: variant(fontSize.md, fontWeight.medium, {
    lineHeight: fontSize.md * 1.45,
  }),
  caption: variant(fontSize.sm, fontWeight.regular, {
    lineHeight: fontSize.sm * 1.4,
  }),
  overline: variant(fontSize.xs, fontWeight.bold, {
    lineHeight: fontSize.xs * 1.4,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  }),
  button: variant(fontSize.base, fontWeight.bold, {
    lineHeight: fontSize.base * 1.2,
    letterSpacing: 0.3,
  }),
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof textVariants;

export const typography = {
  fontFamily,
  fontWeight,
  fontSize,
  variants: textVariants,
} as const;

export type Typography = typeof typography;
