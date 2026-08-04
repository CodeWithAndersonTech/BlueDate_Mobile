import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTabBarClearance } from '../../navigation/tabBarLayout';
import { useTheme } from '../../theme';
import {
  SkeletonBlock,
  SkeletonCircle,
  SkeletonLine,
} from '../../components/skeleton/SkeletonBone';

const AVATAR_SIZE = 86;
const TILE_HEIGHT = 100;

type Props = {
  /** When true, fades the skeleton in (used on first paint). */
  visible?: boolean;
};

/**
 * Profile screen skeleton — mirrors avatar header, bio field, and interest tiles.
 */
export function ProfileSkeleton({ visible = true }: Props) {
  const theme = useTheme();
  const bottomPad = useTabBarClearance(TILE_HEIGHT);
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
      style={[styles.root, { paddingBottom: bottomPad }, fadeStyle]}
      pointerEvents="none">
      <View style={styles.header}>
        <View style={styles.headerActions}>
          <SkeletonCircle size={36} />
          <SkeletonCircle size={36} />
        </View>
        <View style={styles.headerTop}>
          <SkeletonCircle size={AVATAR_SIZE} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <SkeletonLine width={28} height={18} />
              <SkeletonLine width={44} height={10} style={styles.statLabel} />
            </View>
            <View style={styles.statItem}>
              <SkeletonLine width={28} height={18} />
              <SkeletonLine width={40} height={10} style={styles.statLabel} />
            </View>
            <View style={styles.statItem}>
              <SkeletonLine width={28} height={18} />
              <SkeletonLine width={42} height={10} style={styles.statLabel} />
            </View>
          </View>
        </View>

        <View style={styles.nameBlock}>
          <SkeletonLine width="52%" height={18} radius={8} />
          <SkeletonLine width="34%" height={13} style={styles.username} />
        </View>
      </View>

      <View style={styles.body}>
        <SkeletonLine width={72} height={10} style={styles.fieldLabel} />
        <SkeletonBlock height={88} radius={14} />

        <View style={styles.section}>
          <SkeletonLine width={110} height={18} radius={8} />
          <View style={styles.tileGrid}>
            {[0, 1, 2, 3].map(key => (
              <View
                key={key}
                style={[
                  styles.tile,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <View style={styles.tileTop}>
                  <SkeletonBlock width={28} height={28} radius={10} />
                  <SkeletonCircle size={18} />
                </View>
                <SkeletonLine width="70%" height={10} />
                <SkeletonLine width="88%" height={13} style={styles.tileValue} />
              </View>
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 1 },
  header: {
    position: 'relative',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    gap: 12,
  },
  headerActions: {
    position: 'absolute',
    top: 2,
    right: 12,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center', gap: 6, flex: 1 },
  statLabel: { marginTop: 0 },
  nameBlock: { gap: 8, paddingRight: 8 },
  username: { marginTop: 0 },
  body: { paddingHorizontal: 16, paddingTop: 4 },
  fieldLabel: { marginBottom: 8 },
  section: { marginTop: 22, gap: 12 },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  tile: {
    width: '48%',
    height: TILE_HEIGHT,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  tileValue: { marginTop: 2 },
});

export default ProfileSkeleton;
