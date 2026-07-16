import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme';
import { Icon } from './Icon';
import { Typography } from './Typography';

export interface LoadingProps {
  /** Optional caption shown under the spinner. */
  message?: string;
  /** Diameter of the spinner ring in px. */
  size?: number;
  /**
   * When true (default) the loader fills its parent and centres itself so a
   * screen can gate its content behind it. When false it renders inline.
   */
  fullscreen?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Branded activity indicator: a rotating gradient ring with a softly pulsing
 * heart. Reusable across screens that need to wait on data before revealing
 * their content.
 */
export function Loading({
  message,
  size = 64,
  fullscreen = true,
  style,
}: LoadingProps) {
  const theme = useTheme();
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1100, easing: Easing.linear }),
      -1,
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [rotation, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.82 + pulse.value * 0.18 }],
    opacity: 0.65 + pulse.value * 0.35,
  }));

  const stroke = Math.max(4, Math.round(size * 0.08));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const gradient = theme.gradients.primary;
  const from = gradient[0];
  const to = gradient[gradient.length - 1];

  return (
    <View style={[fullscreen ? styles.fullscreen : styles.inline, style]}>
      <View style={{ width: size, height: size }}>
        <Animated.View style={[StyleSheet.absoluteFill, ringStyle]}>
          <Svg width={size} height={size}>
            <Defs>
              <LinearGradient id="bdLoader" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={from} stopOpacity={1} />
                <Stop offset="1" stopColor={to} stopOpacity={0.12} />
              </LinearGradient>
            </Defs>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={theme.colors.border}
              strokeWidth={stroke}
              fill="none"
              opacity={0.35}
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="url(#bdLoader)"
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${circumference * 0.7} ${circumference}`}
            />
          </Svg>
        </Animated.View>
        <View style={styles.center}>
          <Animated.View style={heartStyle}>
            <Icon
              name="heart"
              size={size * 0.34}
              color={theme.colors.primary}
              filled
            />
          </Animated.View>
        </View>
      </View>

      {message ? (
        <Typography
          variant="callout"
          color="textMuted"
          align="center"
          style={styles.message}>
          {message}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 32,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { maxWidth: 260 },
});

export default Loading;
