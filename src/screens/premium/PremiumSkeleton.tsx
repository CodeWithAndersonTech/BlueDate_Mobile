import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  SkeletonBlock,
  SkeletonCircle,
  SkeletonLine,
} from '../../components/skeleton/SkeletonBone';
import { useTabBarClearance } from '../../navigation/tabBarLayout';
import { useTheme } from '../../theme';

type Props = {
  visible?: boolean;
};

/**
 * Premium screen skeleton — gold hero, plan cards, and feature rows.
 */
export function PremiumSkeleton({ visible = true }: Props) {
  const theme = useTheme();
  const bottomPad = useTabBarClearance(24);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.quad),
    });
  }, [visible, opacity]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.root,
        { paddingBottom: bottomPad + 88, backgroundColor: theme.colors.background },
        fadeStyle,
      ]}
      pointerEvents="none">
      <SkeletonBlock height={168} radius={24} />

      <View style={styles.section}>
        <SkeletonLine width={110} height={18} radius={8} />
        <SkeletonBlock height={84} radius={20} />
        <SkeletonBlock height={84} radius={20} />
      </View>

      <View style={styles.section}>
        <SkeletonLine width={130} height={18} radius={8} />
        {[0, 1, 2, 3].map(key => (
          <View
            key={key}
            style={[
              styles.perkRow,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}>
            <SkeletonCircle size={40} />
            <View style={styles.perkText}>
              <SkeletonLine width="55%" height={14} radius={6} />
              <SkeletonLine width="92%" height={11} radius={5} />
              <SkeletonLine width="78%" height={11} radius={5} />
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 28,
  },
  section: { gap: 12 },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  perkText: { flex: 1, gap: 8, paddingTop: 4 },
});

export default PremiumSkeleton;
