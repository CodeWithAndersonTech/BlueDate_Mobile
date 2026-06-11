import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { AccentKey, ColorMode, Theme, buildTheme } from './themes';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeControllerValue {
  theme: Theme;
  /** Resolved mode actually in use (system preference is resolved here). */
  mode: ColorMode;
  /** The user's stored preference, which may be "system". */
  preference: ThemePreference;
  accentKey: AccentKey;
  setPreference: (preference: ThemePreference) => void;
  setAccent: (accent: AccentKey) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeControllerValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialPreference?: ThemePreference;
  initialAccent?: AccentKey;
}

export function ThemeProvider({
  children,
  initialPreference = 'dark',
  initialAccent = 'cosmic',
}: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>(initialPreference);
  const [accentKey, setAccent] = useState<AccentKey>(initialAccent);

  const mode: ColorMode = useMemo(() => {
    if (preference === 'system') {
      return systemScheme === 'light' ? 'light' : 'dark';
    }
    return preference;
  }, [preference, systemScheme]);

  const theme = useMemo(() => buildTheme(mode, accentKey), [mode, accentKey]);

  const toggleMode = useCallback(() => {
    setPreference(current => {
      const resolved =
        current === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : current;
      return resolved === 'dark' ? 'light' : 'dark';
    });
  }, [systemScheme]);

  const value = useMemo<ThemeControllerValue>(
    () => ({
      theme,
      mode,
      preference,
      accentKey,
      setPreference,
      setAccent,
      toggleMode,
    }),
    [theme, mode, preference, accentKey, toggleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Access the active theme object (colors, spacing, typography, ...). */
export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside a <ThemeProvider />');
  }
  return ctx.theme;
}

/** Access the theme controller to change mode / accent at runtime. */
export function useThemeController(): ThemeControllerValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeController must be used inside a <ThemeProvider />');
  }
  return ctx;
}
