import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
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
  filled?: boolean;
  /** Render a circular surface behind the icon. */
  variant?: 'plain' | 'surface' | 'outline';
  disabled?: boolean;
  /** Unread / count badge (0 or undefined hides). */
  badge?: number;
  /** Screen-reader description — required for icon-only affordances. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  name,
  onPress,
  size = 22,
  color,
  filled = false,
  variant = 'surface',
  disabled = false,
  badge,
  accessibilityLabel,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const dim = size + 22;
  const showBadge = typeof badge === 'number' && badge > 0;

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
      accessibilityRole="button"
      accessibilityLabel={
        showBadge
          ? `${accessibilityLabel ?? name}, ${badge}`
          : accessibilityLabel
      }
      accessibilityState={{ disabled }}>
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
        <Icon
          name={name}
          size={size}
          color={color ?? theme.colors.text}
          filled={filled}
        />
        {showBadge ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: theme.colors.primary },
            ]}>
            <Text style={[styles.badgeText, { color: theme.colors.onPrimary }]}>
              {badge > 9 ? '9+' : String(badge)}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
});

export default IconButton;
