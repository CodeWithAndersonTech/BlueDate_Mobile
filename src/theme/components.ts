import { TextStyle, ViewStyle } from 'react-native';
import { control, iconSize, layout, radius, space } from './tokens';
import { fontSize, fontWeight } from './typography';

type RecipeColors = {
  primary: string;
  primarySoft: string;
  surfaceAlt: string;
  textSecondary: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  onPremium: string;
};

export type ButtonSizeToken = {
  height: number;
  paddingH: number;
  fontSize: number;
  icon: number;
};

export type BadgeSizeToken = {
  paddingV: number;
  paddingH: number;
  icon: number;
};

export type ThemeComponents = {
  button: {
    radius: number;
    gap: number;
    sizes: Record<'sm' | 'md' | 'lg', ButtonSizeToken>;
    glow: ViewStyle;
  };
  input: {
    height: number;
    radius: number;
    paddingH: number;
    icon: number;
    borderWidth: number;
    labelGap: number;
    helperGap: number;
  };
  card: {
    radius: number;
    padding: Record<'none' | 'sm' | 'md' | 'lg', number>;
  };
  badge: {
    radius: number;
    gap: number;
    sizes: Record<'sm' | 'md', BadgeSizeToken>;
    tones: Record<
      'neutral' | 'primary' | 'success' | 'warning' | 'danger',
      { bg: string; fg: string }
    >;
    premiumFg: string;
  };
  chip: {
    radius: number;
    gap: number;
    paddingV: number;
    paddingH: number;
    icon: number;
  };
  iconButton: {
    pad: number;
    badge: number;
    badgeText: TextStyle;
  };
  screen: {
    paddingH: number;
  };
  header: {
    height: number;
    paddingH: number;
    largePaddingH: number;
    actionGap: number;
  };
  avatar: {
    ring: number;
    online: number;
    sizes: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl', number>;
  };
};

export function buildComponentRecipes(ctx: {
  colors: RecipeColors;
  isDark: boolean;
}): ThemeComponents {
  const { colors, isDark } = ctx;

  return {
    button: {
      radius: radius.pill,
      gap: space.sm,
      sizes: {
        sm: {
          height: 42,
          paddingH: space.lg,
          fontSize: fontSize.sm,
          icon: iconSize.sm,
        },
        md: {
          height: 54,
          paddingH: 22,
          fontSize: fontSize.base,
          icon: 18,
        },
        lg: {
          height: 58,
          paddingH: 26,
          fontSize: 17,
          icon: iconSize.md,
        },
      },
      glow: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.28 : 0.18,
        shadowRadius: 10,
        elevation: 6,
      },
    },
    input: {
      height: control.inputHeight,
      radius: radius.lg,
      paddingH: space.lg,
      icon: iconSize.md,
      borderWidth: control.border,
      labelGap: 6,
      helperGap: 6,
    },
    card: {
      radius: radius.xl,
      padding: {
        none: 0,
        sm: space.md,
        md: space.lg,
        lg: space.xxl,
      },
    },
    badge: {
      radius: radius.pill,
      gap: space.xs,
      sizes: {
        sm: { paddingV: space.xs, paddingH: 10, icon: iconSize.xs },
        md: { paddingV: 6, paddingH: 14, icon: 14 },
      },
      tones: {
        neutral: { bg: colors.surfaceAlt, fg: colors.textSecondary },
        primary: { bg: colors.primarySoft, fg: colors.primary },
        success: { bg: colors.successSoft, fg: colors.success },
        warning: { bg: colors.warningSoft, fg: colors.warning },
        danger: { bg: colors.dangerSoft, fg: colors.danger },
      },
      premiumFg: colors.onPremium,
    },
    chip: {
      radius: radius.pill,
      gap: 6,
      paddingV: 10,
      paddingH: space.lg,
      icon: 14,
    },
    iconButton: {
      pad: control.iconButtonPad,
      badge: 16,
      badgeText: {
        fontSize: 9,
        fontWeight: fontWeight.bold,
        lineHeight: 11,
      },
    },
    screen: {
      paddingH: layout.screenPadding,
    },
    header: {
      height: control.headerHeight,
      paddingH: layout.headerPadding,
      largePaddingH: layout.screenPadding,
      actionGap: space.sm,
    },
    avatar: {
      ring: 2.5,
      online: 14,
      sizes: {
        xs: 32,
        sm: 40,
        md: 52,
        lg: 72,
        xl: 96,
        xxl: 128,
      },
    },
  };
}
