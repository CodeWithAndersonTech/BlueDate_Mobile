import { useMemo } from 'react';
import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Theme, useTheme } from '../theme';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Builds a memoized StyleSheet that depends on the active theme. The factory is
 * only re-run when the theme reference changes (i.e. on mode / accent change).
 *
 * @example
 * const styles = useThemedStyles(theme => ({
 *   container: { backgroundColor: theme.colors.background },
 * }));
 */
export function useThemedStyles<T extends NamedStyles<T>>(
  factory: (theme: Theme) => T,
): T {
  const theme = useTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [theme, factory]);
}
