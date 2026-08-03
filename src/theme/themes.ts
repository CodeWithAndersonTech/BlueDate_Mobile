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
  typography: typeof typography;
  shadows: ThemeShadows;
}

function buildShadows(mode: ColorMode, accent: AccentDefinition): ThemeShadows {
  const shadowColor = mode === 'dark' ? '#000000' : '#0A0A0F';
  const baseOpacity = mode === 'dark' ? 0.35 : 0.08;

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
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: baseOpacity + 0.04,
      shadowRadius: 16,
      elevation: 5,
    },
    lg: {
      shadowColor,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: baseOpacity + 0.06,
      shadowRadius: 24,
      elevation: 10,
    },
    glow: {
      shadowColor: accent.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: Platform.OS === 'ios' ? 0.35 : 0.45,
      shadowRadius: 18,
      elevation: 8,
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
    typography,
    shadows: buildShadows(mode, accent),
  };
}

/** Pre-built default themes (cosmic accent) for quick access. */
export const darkTheme = buildTheme('dark', 'cosmic');
export const lightTheme = buildTheme('light', 'cosmic');

export { accentOrder, accents };
export type { AccentKey, AccentDefinition, ColorMode };
