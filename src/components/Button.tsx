import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme';
import { Icon, IconName } from './Icon';
import { Typography } from './Typography';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: IconName;
  rightIcon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<
  ButtonSize,
  { height: number; paddingH: number; fontSize: number; icon: number }
> = {
  sm: { height: 42, paddingH: 18, fontSize: 14, icon: 16 },
  md: { height: 54, paddingH: 22, fontSize: 16, icon: 18 },
  lg: { height: 58, paddingH: 26, fontSize: 17, icon: 20 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);
  const dims = SIZES[size];
  const isDisabled = disabled || loading;
  const radius = theme.radii.pill;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: pressed.value * (theme.isDark ? 0.14 : 0.08),
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.965, { damping: 16, stiffness: 340 });
    pressed.value = withTiming(1, { duration: 90 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 13, stiffness: 260 });
    pressed.value = withTiming(0, { duration: 160 });
  };

  const isSolid = variant === 'primary' || variant === 'danger';
  const contentColor =
    variant === 'primary'
      ? theme.colors.onPrimary
      : variant === 'danger'
      ? theme.colors.white
      : variant === 'outline' || variant === 'ghost'
      ? theme.colors.primary
      : theme.colors.text;

  // Gentle, evenly-spread colored shadow for the hero action (not a harsh
  // glow), a soft neutral drop shadow for filled variants, nothing for flat.
  const softGlow: ViewStyle = {
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: theme.isDark ? 0.28 : 0.18,
    shadowRadius: 10,
    elevation: 6,
  };
  const shadow =
    variant === 'primary'
      ? softGlow
      : variant === 'ghost' || variant === 'outline'
      ? theme.shadows.none
      : theme.shadows.sm;

  const surface: ViewStyle = {
    height: dims.height,
    paddingHorizontal: dims.paddingH,
    borderRadius: radius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    overflow: 'hidden',
  };

  const inner = loading ? (
    <ActivityIndicator color={contentColor} />
  ) : (
    <>
      {leftIcon && <Icon name={leftIcon} size={dims.icon} color={contentColor} />}
      <Typography
        variant="button"
        tint={contentColor}
        align="center"
        numberOfLines={1}
        style={{
          fontSize: dims.fontSize,
          lineHeight: dims.fontSize + 2,
          flexShrink: 1,
        }}>
        {label}
      </Typography>
      {rightIcon && <Icon name={rightIcon} size={dims.icon} color={contentColor} />}
    </>
  );

  // Pressed-state darkening overlay (only meaningful on solid surfaces).
  const pressOverlay = isSolid ? (
    <Animated.View
      style={[styles.fill, { backgroundColor: theme.colors.black }, overlayStyle]}
    />
  ) : null;

  const renderSurface = () => {
    if (variant === 'primary') {
      return (
        <LinearGradient
          colors={theme.gradients.primary}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={surface}>
          {pressOverlay}
          {inner}
        </LinearGradient>
      );
    }

    const variantStyle: ViewStyle =
      variant === 'secondary'
        ? {
            backgroundColor: theme.colors.surfaceAlt,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }
        : variant === 'outline'
        ? {
            backgroundColor: theme.colors.primarySoft,
            borderWidth: 1.5,
            borderColor: theme.colors.primary,
          }
        : variant === 'danger'
        ? { backgroundColor: theme.colors.danger }
        : { backgroundColor: 'transparent' };

    return (
      <View style={[surface, variantStyle]}>
        {pressOverlay}
        {inner}
      </View>
    );
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={[fullWidth && styles.fullWidth, style]}>
      <Animated.View
        style={[
          {
            borderRadius: radius,
            alignSelf: fullWidth ? 'stretch' : 'flex-start',
            opacity: isDisabled ? 0.5 : 1,
          },
          !isDisabled && shadow,
          animatedStyle,
        ]}>
        {renderSurface()}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: { alignSelf: 'stretch' },
  fill: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
});

export default Button;
