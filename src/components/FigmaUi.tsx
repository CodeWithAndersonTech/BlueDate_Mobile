import React, { useEffect } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme';
import { FigmaIcon } from './FigmaIcon';
import { Typography } from './Typography';

export type FigmaButtonTone = 'solid' | 'soft' | 'ghost' | 'text' | 'muted' | 'danger';
export type FigmaButtonSize = 'compact' | 'chip' | 'cta' | 'md';

type SizeRecipe = {
  height?: number;
  paddingH: number;
  paddingV: number;
  radius: number;
  text: 'caption' | 'button';
};

const SIZES: Record<FigmaButtonSize, SizeRecipe> = {
  compact: { height: 22, paddingH: 8, paddingV: 0, radius: 8, text: 'caption' },
  chip: { height: 27, paddingH: 10, paddingV: 0, radius: 15, text: 'caption' },
  cta: { height: 38, paddingH: 10, paddingV: 0, radius: 15, text: 'caption' },
  md: { height: 54, paddingH: 22, paddingV: 0, radius: 999, text: 'button' },
};

export type FigmaButtonProps = {
  label: string;
  tone?: FigmaButtonTone;
  size?: FigmaButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  trailing?: 'arrow';
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Meerk Figma actions — chips, save docks, in-card CTAs. */
export function FigmaButton({
  label,
  tone = 'solid',
  size = 'chip',
  loading = false,
  disabled = false,
  fullWidth = false,
  trailing,
  onPress,
  accessibilityLabel,
  style,
}: FigmaButtonProps) {
  const theme = useTheme();
  const recipe = SIZES[size];
  const busy = loading;
  const inactive = disabled && !busy;
  const tappable = onPress != null && !inactive && !busy;

  const backgroundColor =
    tone === 'solid'
      ? theme.colors.plusCta
      : tone === 'danger'
        ? theme.colors.danger
        : tone === 'soft'
          ? theme.colors.plusSoft
          : tone === 'ghost'
            ? theme.colors.plusIconSoft
            : 'transparent';
  const tint =
    tone === 'solid' || tone === 'danger'
      ? theme.colors.white
      : tone === 'muted'
        ? theme.colors.textMuted
        : theme.colors.plusCta;

  const body = (
    <>
      {busy ? (
        <FigmaSpinner
          size={recipe.text === 'button' ? 18 : 16}
          color={tint}
        />
      ) : null}
      <Typography
        variant={recipe.text}
        weight="600"
        tint={inactive ? theme.colors.textMuted : tint}
        numberOfLines={1}>
        {label}
      </Typography>
      {trailing === 'arrow' && !busy ? (
        <FigmaIcon
          name="arrowRight"
          size={15}
          color={inactive ? theme.colors.textMuted : tint}
        />
      ) : null}
    </>
  );

  const box: ViewStyle = {
    height: recipe.height,
    paddingHorizontal: recipe.paddingH,
    paddingVertical: recipe.height ? 0 : recipe.paddingV,
    borderRadius: recipe.radius,
    backgroundColor: inactive ? theme.colors.surfaceAlt : backgroundColor,
    opacity: inactive ? 0.45 : 1,
  };

  if (!tappable) {
    return (
      <View
        accessibilityRole={onPress ? 'button' : 'text'}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: inactive, busy }}
        style={[
          styles.row,
          fullWidth ? styles.full : styles.intrinsic,
          box,
          style,
        ]}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={!tappable}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy }}
      style={({ pressed }) => [
        styles.row,
        fullWidth ? styles.full : styles.intrinsic,
        box,
        { opacity: pressed ? 0.88 : 1 },
        style,
      ]}>
      {body}
    </Pressable>
  );
}

type SpinnerProps = {
  /** Fill parent and center (list/screen gate). */
  fill?: boolean;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/** Shared plus-gold spinner used on Figma screens. Native ActivityIndicator is avoided. */
export function FigmaSpinner({
  fill = false,
  size = 22,
  color,
  style,
}: SpinnerProps) {
  const theme = useTheme();
  const tint = color ?? theme.colors.plusCta;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.linear }),
      -1,
      false,
    );
  }, [progress]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 360}deg` }],
  }));

  const thickness = Math.max(2, Math.round(size / 11));
  const ring = (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: thickness,
          borderColor: tint,
          opacity: 0.22,
        }}
      />
      <Animated.View
        accessibilityRole="progressbar"
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: thickness,
            // RN processColor rejects `transparent` on mixed border*Color.
            borderTopColor: tint,
            borderRightColor: 'rgba(0,0,0,0)',
            borderBottomColor: 'rgba(0,0,0,0)',
            borderLeftColor: 'rgba(0,0,0,0)',
          },
          anim,
        ]}
      />
    </View>
  );

  if (!fill) {
    return <View style={style}>{ring}</View>;
  }
  return <View style={[styles.fill, style]}>{ring}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  full: {
    alignSelf: 'stretch',
    width: '100%',
  },
  intrinsic: {
    alignSelf: 'flex-start',
  },
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
