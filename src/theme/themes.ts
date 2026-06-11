import { Platform, ViewStyle } from 'react-native';
import {
  AccentDefinition,
  AccentKey,
  ColorMode,
  accentOrder,
  accents,
  common,
  neutrals,
  statusColors,
} from './palette';
import { radii } from './radii';
import { spacing } from './spacing';
import { typography } from './typography';

export interface ThemeColors {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceAlt: string;
  card: string;
  cardElevated: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primarySoft: string;
  secondary: string;
  onPrimary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  online: string;
  offline: string;
  overlay: string;
  backdrop: string;
  skeleton: string;
  tabBar: string;
  white: string;
  black: string;
  transparent: string;
}

export interface ThemeGradients {
  primary: string[];
  premium: string[];
  /** Subtle vertical wash used behind hero sections. */
  hero: string[];
  /** Glassy card background gradient. */
  card: string[];
}

export type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

export interface ThemeShadows {
  none: ShadowStyle;
  sm: ShadowStyle;
  md: ShadowStyle;
  lg: ShadowStyle;
  /** Colored glow that matches the active accent (the "gaming" feel). */
  glow: ShadowStyle;
}

export interface Theme {
  mode: ColorMode;
  accent: AccentDefinition;
  accentKey: AccentKey;
  isDark: boolean;
  colors: ThemeColors;
  gradients: ThemeGradients;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  shadows: ThemeShadows;
}

function buildShadows(mode: ColorMode, accent: AccentDefinition): ThemeShadows {
  const shadowColor = mode === 'dark' ? '#000000' : '#1B1F3B';
  const baseOpacity = mode === 'dark' ? 0.45 : 0.12;

  return {
    none: {
      shadowColor: common.transparent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: baseOpacity,
      shadowRadius: 6,
      elevation: 3,
    },
    md: {
      shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: baseOpacity + 0.04,
      shadowRadius: 16,
      elevation: 8,
    },
    lg: {
      shadowColor,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: baseOpacity + 0.08,
      shadowRadius: 28,
      elevation: 16,
    },
    glow: {
      shadowColor: accent.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: Platform.OS === 'ios' ? 0.6 : 0.9,
      shadowRadius: 20,
      elevation: 12,
    },
  };
}

export function buildTheme(mode: ColorMode, accentKey: AccentKey): Theme {
  const accent = accents[accentKey];
  const n = neutrals[mode];

  const colors: ThemeColors = {
    ...n,
    primary: accent.primary,
    primarySoft: accent.soft,
    secondary: accent.secondary,
    onPrimary: accent.onPrimary,
    success: statusColors.success,
    warning: statusColors.warning,
    danger: statusColors.danger,
    info: statusColors.info,
    online: statusColors.online,
    offline: statusColors.offline,
    white: common.white,
    black: common.black,
    transparent: common.transparent,
  };

  const gradients: ThemeGradients = {
    primary: accent.gradient,
    premium: statusColors.premiumGradient,
    hero:
      mode === 'dark'
        ? [accent.primary, n.backgroundAlt, n.background]
        : [accent.soft, n.surfaceAlt, n.background],
    card:
      mode === 'dark'
        ? ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']
        : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)'],
  };

  return {
    mode,
    accent,
    accentKey,
    isDark: mode === 'dark',
    colors,
    gradients,
    spacing,
    radii,
    typography,
    shadows: buildShadows(mode, accent),
  };
}

/** Pre-built default themes (cosmic accent) for quick access. */
export const darkTheme = buildTheme('dark', 'cosmic');
export const lightTheme = buildTheme('light', 'cosmic');

export { accentOrder, accents };
export type { AccentKey, AccentDefinition, ColorMode };
