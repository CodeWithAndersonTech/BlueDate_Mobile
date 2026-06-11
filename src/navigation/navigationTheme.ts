import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavLightTheme,
  Theme as NavTheme,
} from '@react-navigation/native';
import { Theme } from '../theme';

/** Map our design-system theme onto a React Navigation theme object. */
export function toNavigationTheme(theme: Theme): NavTheme {
  const base = theme.isDark ? NavDarkTheme : NavLightTheme;
  return {
    ...base,
    dark: theme.isDark,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
  };
}
