import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  SkeletonBlock,
  SkeletonLine,
} from '../../components/skeleton/SkeletonBone';
import { useTabBarClearance } from '../../navigation/tabBarLayout';
import { useTheme } from '../../theme';

const H_PAD = 20;
const GAP = 12;
const CARD_COUNT = 6;
/** Matches NearbyCard grid circle diameter. */
const CIRCLE = 132;

type Props = {
  /** When true, fades the skeleton in (used on first paint). */
  visible?: boolean;
};

/**
 * Nearby skeleton — header + circular avatar grid (current Nearby UI).
 */
export function NearbySkeleton({ visible = true }: Props) {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const bottomPad = useTabBarClearance(16);
  const opacity = useSharedValue(0);

  const cardW = (windowWidth - H_PAD * 2 - GAP) / 2;

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
        { paddingBottom: bottomPad, backgroundColor: theme.colors.background },
        fadeStyle,
      ]}
      pointerEvents="none">
      {/* Header — eyebrow + title + round scan button */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <SkeletonLine width={72} height={11} radius={6} />
          <SkeletonLine
            width={148}
            height={26}
            radius={8}
            style={styles.title}
          />
        </View>
        <SkeletonBlock width={44} height={44} radius={22} />
      </View>

      {/* Circular profile grid */}
      <View style={styles.grid}>
        {Array.from({ length: CARD_COUNT }).map((_, i) => (
          <View key={i} style={[styles.card, { width: cardW }]}>
            <View style={styles.circleWrap}>
              <SkeletonBlock
                width={CIRCLE}
                height={CIRCLE}
                radius={CIRCLE / 2}
              />
              <View
                style={[
                  styles.addFab,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <SkeletonBlock width={18} height={18} radius={9} />
              </View>
            </View>
            <SkeletonLine width={72} height={14} radius={7} />
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 1 },
  header: {
    paddingHorizontal: H_PAD,
    paddingTop: 4,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: { flex: 1, gap: 8, paddingTop: 2 },
  title: { marginTop: 2 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 18,
    paddingHorizontal: H_PAD,
    paddingTop: 8,
  },
  card: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  circleWrap: {
    width: CIRCLE,
    height: CIRCLE,
    position: 'relative',
  },
  addFab: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});

export default NearbySkeleton;
