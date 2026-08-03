/**
 * Premium color tokens — Meerk / BlueDate 2026 design system.
 * Semantic mapping lives in themes.ts.
 */

export type ColorMode = 'light' | 'dark';
export type AccentKey = 'cosmic' | 'aurora' | 'sunset';

export interface AccentDefinition {
  key: AccentKey;
  label: string;
  primary: string;
  secondary: string;
  soft: string;
  gradient: [string, string, ...string[]];
  onPrimary: string;
  glow: string;
}

export const accents: Record<AccentKey, AccentDefinition> = {
  cosmic: {
    key: 'cosmic',
    label: 'Cosmic',
    primary: '#6E56F8',
    secondary: '#3B9EFF',
    soft: 'rgba(110, 86, 248, 0.14)',
    gradient: ['#6E56F8', '#4F7CFF', '#3B9EFF'],
    onPrimary: '#FFFFFF',
    glow: 'rgba(110, 86, 248, 0.35)',
  },
  aurora: {
    key: 'aurora',
    label: 'Aurora',
    primary: '#12C4A0',
    secondary: '#2F9BFF',
    soft: 'rgba(18, 196, 160, 0.14)',
    gradient: ['#12C4A0', '#14B8C4', '#2F9BFF'],
    onPrimary: '#04241D',
    glow: 'rgba(18, 196, 160, 0.32)',
  },
  sunset: {
    key: 'sunset',
    label: 'Sunset',
    primary: '#FF5A6A',
    secondary: '#FF9F43',
    soft: 'rgba(255, 90, 106, 0.14)',
    gradient: ['#FF5A6A', '#FF7A59', '#FF9F43'],
    onPrimary: '#FFFFFF',
    glow: 'rgba(255, 90, 106, 0.32)',
  },
};

export const accentOrder: AccentKey[] = ['cosmic', 'aurora', 'sunset'];

export const statusColors = {
  success: '#30D158',
  warning: '#FFB020',
  danger: '#FF453A',
  info: '#64D2FF',
  online: '#30D158',
  offline: '#8E8E93',
  premiumGradient: ['#F5D76E', '#E8A838'] as [string, string],
} as const;

/** Soft, product-grade neutrals (Apple / Linear inspired). */
export const neutrals = {
  dark: {
    background: '#0A0A0F',
    backgroundAlt: '#111118',
    surface: '#16161F',
    surfaceAlt: '#1C1C28',
    card: '#181822',
    cardElevated: '#22222E',
    border: 'rgba(255, 255, 255, 0.06)',
    borderStrong: 'rgba(255, 255, 255, 0.12)',
    text: '#F5F5F7',
    textSecondary: '#A1A1B2',
    textMuted: '#6C6C80',
    textInverse: '#0A0A0F',
    overlay: 'rgba(10, 10, 15, 0.72)',
    backdrop: 'rgba(0, 0, 0, 0.55)',
    skeleton: 'rgba(255, 255, 255, 0.06)',
    tabBar: 'transparent',
  },
  light: {
    background: '#F5F5F7',
    backgroundAlt: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceAlt: '#F0F0F5',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    border: 'rgba(0, 0, 0, 0.06)',
    borderStrong: 'rgba(0, 0, 0, 0.12)',
    text: '#1C1C1E',
    textSecondary: '#3A3A3C',
    textMuted: '#8E8E93',
    textInverse: '#FFFFFF',
    overlay: 'rgba(255, 255, 255, 0.78)',
    backdrop: 'rgba(0, 0, 0, 0.35)',
    skeleton: 'rgba(0, 0, 0, 0.05)',
    tabBar: 'transparent',
  },
} as const;

export const common = {
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;
