import React from 'react';
import {
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

export type CardVariant = 'surface' | 'elevated' | 'outline' | 'glass';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  variant = 'surface',
  padding = 'md',
  onPress,
  glow = false,
  style,
}: CardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const recipe = theme.components.card;
  const paddingValue = recipe.padding[padding];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const baseStyle: ViewStyle = {
    borderRadius: recipe.radius,
    padding: paddingValue,
    overflow: 'hidden',
  };

  const variantStyle: ViewStyle =
    variant === 'elevated'
      ? { backgroundColor: theme.colors.cardElevated, ...theme.shadows.md }
      : variant === 'outline'
      ? {
          backgroundColor: theme.colors.transparent,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
        }
      : variant === 'glass'
      ? { backgroundColor: theme.colors.card, ...theme.shadows.sm }
      : { backgroundColor: theme.colors.card, ...theme.shadows.sm };

  const content =
    variant === 'glass' ? (
      <View style={[baseStyle, variantStyle, glow && theme.shadows.glow, style]}>
        <LinearGradient
          colors={theme.gradients.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    ) : (
      <View style={[baseStyle, variantStyle, glow && theme.shadows.glow, style]}>{children}</View>
    );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        (scale.value = withSpring(
          theme.motion.cardPressScale,
          theme.motion.springIn,
        ))
      }
      onPressOut={() => (scale.value = withSpring(1, theme.motion.springOut))}>
      <Animated.View style={animatedStyle}>{content}</Animated.View>
    </Pressable>
  );
}

export default Card;
