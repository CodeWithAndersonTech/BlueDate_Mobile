import React, { useEffect } from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

export type SkeletonBoneProps = {
  width?: number | `${number}%` | '100%';
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  /** Circle shorthand — sets equal width/height and full radius. */
  circle?: boolean;
};

const SHIMMER_DURATION_MS = 1600;

/**
 * Theme-aware skeleton bone with a soft horizontal shimmer.
 * Base color comes from `theme.colors.skeleton`.
 */
export function SkeletonBone({
  width = '100%',
  height = 14,
  radius = 8,
  style,
  circle = false,
}: SkeletonBoneProps) {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: SHIMMER_DURATION_MS,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      false,
    );
  }, [progress]);

  const size = circle ? height : undefined;
  const resolvedRadius = circle ? height / 2 : radius;

  const shimmerStyle = useAnimatedStyle(() => {
    const travel = screenWidth * 1.2;
    return {
      transform: [
        {
          translateX: interpolate(progress.value, [0, 1], [-travel * 0.5, travel]),
        },
      ],
    };
  });

  const highlight = theme.isDark
    ? 'rgba(255,255,255,0.08)'
    : 'rgba(255,255,255,0.55)';
  const mid = theme.isDark
    ? 'rgba(255,255,255,0.03)'
    : 'rgba(255,255,255,0.22)';

  return (
    <View
      style={[
        styles.bone,
        {
          width: circle ? size : width,
          height: circle ? size : height,
          borderRadius: resolvedRadius,
          backgroundColor: theme.colors.skeleton,
          overflow: 'hidden',
        },
        style,
      ]}>
      <Animated.View style={[styles.shimmerTrack, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', mid, highlight, mid, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
}

export function SkeletonLine({
  width = '100%',
  height = 12,
  radius = 6,
  style,
}: Omit<SkeletonBoneProps, 'circle'>) {
  return (
    <SkeletonBone width={width} height={height} radius={radius} style={style} />
  );
}

export function SkeletonCircle({
  size = 40,
  style,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <SkeletonBone circle height={size} style={style} />;
}

export function SkeletonBlock({
  width = '100%',
  height = 80,
  radius = 16,
  style,
}: Omit<SkeletonBoneProps, 'circle'>) {
  return (
    <SkeletonBone
      width={width}
      height={height}
      radius={radius}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  bone: {
    position: 'relative',
  },
  shimmerTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '60%',
  },
  shimmerGradient: {
    flex: 1,
  },
});
