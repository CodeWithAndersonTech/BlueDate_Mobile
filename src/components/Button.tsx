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
} from 'react-native-reanimated';
import { useTheme } from '../theme';
import { Icon, IconName } from './Icon';
import { Typography } from './Typography';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
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

const SIZES: Record<ButtonSize, { height: number; paddingH: number; fontSize: number; icon: number }> = {
  sm: { height: 40, paddingH: 16, fontSize: 14, icon: 16 },
  md: { height: 52, paddingH: 22, fontSize: 16, icon: 18 },
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
  const dims = SIZES[size];
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 320 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 280 });
  };

  const contentColor =
    variant === 'primary'
      ? theme.colors.onPrimary
      : variant === 'danger'
      ? theme.colors.white
      : variant === 'outline' || variant === 'ghost'
      ? theme.colors.primary
      : theme.colors.text;

  const base: ViewStyle = {
    height: dims.height,
    paddingHorizontal: dims.paddingH,
    borderRadius: theme.radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    opacity: isDisabled ? 0.55 : 1,
  };

  const inner = (
    <>
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <>
          {leftIcon && <Icon name={leftIcon} size={dims.icon} color={contentColor} />}
          <Typography variant="button" tint={contentColor} style={{ fontSize: dims.fontSize }}>
            {label}
          </Typography>
          {rightIcon && <Icon name={rightIcon} size={dims.icon} color={contentColor} />}
        </>
      )}
    </>
  );

  const renderSurface = () => {
    if (variant === 'primary') {
      return (
        <LinearGradient
          colors={theme.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[base, !isDisabled && theme.shadows.glow]}>
          {inner}
        </LinearGradient>
      );
    }

    const variantStyle: ViewStyle =
      variant === 'secondary'
        ? { backgroundColor: theme.colors.surfaceAlt }
        : variant === 'outline'
        ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.colors.primary }
        : variant === 'danger'
        ? { backgroundColor: theme.colors.danger }
        : { backgroundColor: 'transparent' };

    return <View style={[base, variantStyle]}>{inner}</View>;
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
      <Animated.View style={[fullWidth && styles.fullWidth, animatedStyle]}>
        {renderSurface()}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: { alignSelf: 'stretch' },
});

export default Button;
