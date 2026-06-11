/**
 * Raw color tokens. These are intentionally "dumb" values; semantic mapping to
 * theme roles (background, text, primary, ...) happens in themes.ts.
 *
 * The app ships with three switchable accent themes on top of a light/dark
 * neutral base, giving 6 total combinations.
 */

export type ColorMode = 'light' | 'dark';
export type AccentKey = 'cosmic' | 'aurora' | 'sunset';

export interface AccentDefinition {
  key: AccentKey;
  label: string;
  /** Primary brand color. */
  primary: string;
  /** Secondary / supporting brand color. */
  secondary: string;
  /** Soft tint used for chips, focus rings, subtle fills. */
  soft: string;
  /** Hero gradient used on primary buttons, splash, highlights. */
  gradient: [string, string, ...string[]];
  /** Text/icon color that sits on top of the primary / gradient. */
  onPrimary: string;
  /** Glow color for "gaming" elevation effects. */
  glow: string;
}

export const accents: Record<AccentKey, AccentDefinition> = {
  cosmic: {
    key: 'cosmic',
    label: 'Cosmic',
    primary: '#7C5CFC',
    secondary: '#23C4FF',
    soft: 'rgba(124, 92, 252, 0.16)',
    gradient: ['#7C5CFC', '#2D8BFF', '#23C4FF'],
    onPrimary: '#FFFFFF',
    glow: 'rgba(124, 92, 252, 0.55)',
  },
  aurora: {
    key: 'aurora',
    label: 'Aurora',
    primary: '#10D9A3',
    secondary: '#1FA2FF',
    soft: 'rgba(16, 217, 163, 0.16)',
    gradient: ['#0FD3A3', '#10C6C6', '#1FA2FF'],
    onPrimary: '#04241D',
    glow: 'rgba(16, 217, 163, 0.5)',
  },
  sunset: {
    key: 'sunset',
    label: 'Sunset',
    primary: '#FF5F6D',
    secondary: '#FFB23E',
    soft: 'rgba(255, 95, 109, 0.16)',
    gradient: ['#FF5F6D', '#FF7A59', '#FFB23E'],
    onPrimary: '#FFFFFF',
    glow: 'rgba(255, 95, 109, 0.5)',
  },
};

export const accentOrder: AccentKey[] = ['cosmic', 'aurora', 'sunset'];

/** Status + utility colors shared across every theme. */
export const statusColors = {
  success: '#22C55E',
  warning: '#F4B740',
  danger: '#FF4D6D',
  info: '#3B9DFF',
  online: '#2DD36F',
  offline: '#8A8FA3',
  premiumGradient: ['#FFD200', '#F7971E'] as [string, string],
} as const;

/** Neutral ramps for each color mode. */
export const neutrals = {
  dark: {
    background: '#08080F',
    backgroundAlt: '#0E0E18',
    surface: '#14141F',
    surfaceAlt: '#1B1B29',
    card: '#16161F',
    cardElevated: '#1E1E2D',
    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.16)',
    text: '#F6F7FB',
    textSecondary: '#AEB2C7',
    textMuted: '#6E7391',
    textInverse: '#0B0B12',
    overlay: 'rgba(8, 8, 15, 0.72)',
    backdrop: 'rgba(0, 0, 0, 0.6)',
    skeleton: 'rgba(255, 255, 255, 0.06)',
    tabBar: 'rgba(16, 16, 24, 0.92)',
  },
  light: {
    background: '#F3F4FB',
    backgroundAlt: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF0F8',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    border: 'rgba(17, 18, 26, 0.08)',
    borderStrong: 'rgba(17, 18, 26, 0.16)',
    text: '#11121A',
    textSecondary: '#4B4F63',
    textMuted: '#8A8FA3',
    textInverse: '#FFFFFF',
    overlay: 'rgba(255, 255, 255, 0.75)',
    backdrop: 'rgba(17, 18, 26, 0.4)',
    skeleton: 'rgba(17, 18, 26, 0.06)',
    tabBar: 'rgba(255, 255, 255, 0.94)',
  },
} as const;

export const common = {
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;
