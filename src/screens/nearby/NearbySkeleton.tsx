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
const CARD_ASPECT = 0.72;

type Props = {
  /** When true, fades the skeleton in (used on first paint). */
  visible?: boolean;
};

/**
 * Nearby screen skeleton — mirrors header, scan banner, and photo-card grid.
 */
export function NearbySkeleton({ visible = true }: Props) {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const bottomPad = useTabBarClearance(16);
  const opacity = useSharedValue(0);

  const cardW = (windowWidth - H_PAD * 2 - GAP) / 2;
  const cardH = cardW / CARD_ASPECT;

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
      {/* Header — eyebrow + title + scan chip */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <SkeletonLine width={72} height={11} radius={6} />
          <SkeletonLine width={148} height={26} radius={8} style={styles.title} />
        </View>
        <SkeletonBlock width={44} height={44} radius={14} />
      </View>

      {/* Scan banner */}
      <View
        style={[
          styles.banner,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}>
        <SkeletonBlock width={48} height={48} radius={12} />
        <View style={styles.bannerCopy}>
          <SkeletonLine width="55%" height={14} radius={6} />
          <SkeletonLine width="88%" height={11} radius={5} />
        </View>
      </View>

      {/* Photo card grid */}
      <View style={styles.grid}>
        {Array.from({ length: CARD_COUNT }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.card,
              {
                width: cardW,
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}>
            <View style={[styles.photo, { height: cardH }]}>
              <SkeletonBlock width="100%" height={cardH} radius={0} />
              <View style={styles.cardMeta}>
                <SkeletonLine
                  width="58%"
                  height={13}
                  radius={6}
                  style={styles.metaName}
                />
                <SkeletonBlock width={30} height={30} radius={15} />
              </View>
            </View>
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
  banner: {
    marginHorizontal: H_PAD,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerCopy: { flex: 1, gap: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    paddingHorizontal: H_PAD,
    paddingTop: 4,
  },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    position: 'relative',
  },
  cardMeta: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaName: {
    // Soften the bone so it reads as name text over photo
    opacity: 0.85,
  },
});

export default NearbySkeleton;
