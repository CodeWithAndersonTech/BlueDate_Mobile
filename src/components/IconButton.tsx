import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../theme';
import { Icon, IconName } from './Icon';

export interface IconButtonProps {
  name: IconName;
  onPress?: () => void;
  size?: number;
  color?: string;
  /** Render a circular surface behind the icon. */
  variant?: 'plain' | 'surface' | 'outline';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  name,
  onPress,
  size = 22,
  color,
  variant = 'surface',
  disabled = false,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const dim = size + 22;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const surfaceStyle: ViewStyle =
    variant === 'surface'
      ? { backgroundColor: theme.colors.surfaceAlt }
      : variant === 'outline'
      ? { borderWidth: 1, borderColor: theme.colors.border }
      : {};

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => (scale.value = withSpring(0.9, { damping: 14, stiffness: 320 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 11, stiffness: 260 }))}
      hitSlop={6}
      accessibilityRole="button">
      <Animated.View
        style={[
          {
            width: dim,
            height: dim,
            borderRadius: dim / 2,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled ? 0.5 : 1,
          },
          surfaceStyle,
          animatedStyle,
          style,
        ]}>
        <Icon name={name} size={size} color={color ?? theme.colors.text} />
      </Animated.View>
    </Pressable>
  );
}

export default IconButton;
