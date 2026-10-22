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
  SkeletonCircle,
  SkeletonLine,
} from '../../components/skeleton/SkeletonBone';
import { useTabBarClearance } from '../../navigation/tabBarLayout';
import { useTheme } from '../../theme';

const COVER_RATIO = 478 / 393;
const AVATAR_RATIO = 82 / 393;
const VISIT_AVATAR = 86;

type Props = {
  visible?: boolean;
  /** `hero` = own Figma profile. `visit` = other user (no cover). */
  variant?: 'hero' | 'visit';
};

function ownCoverHeight(width: number, height: number) {
  return Math.round(Math.min(width * COVER_RATIO, height * 0.3, 280));
}

/** Profile skeleton matching the current Figma layout. */
export function ProfileSkeleton({ visible = true, variant = 'hero' }: Props) {
  const theme = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const bottomPad = useTabBarClearance(24);
  const coverH = ownCoverHeight(windowWidth, windowHeight);
  const avatarSize = Math.round(windowWidth * AVATAR_RATIO);
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, {
      duration: 180,
      easing: Easing.out(Easing.quad),
    });
  }, [visible, opacity]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.root,
        {
          paddingBottom: bottomPad,
          backgroundColor: theme.colors.background,
        },
        fadeStyle,
      ]}
      pointerEvents="none">
      {variant === 'hero' ? (
        <>
          <SkeletonBlock height={coverH} radius={0} />
          <View style={[styles.identity, { marginTop: -avatarSize / 2 }]}>
            <SkeletonCircle size={avatarSize} />
            <SkeletonLine width="46%" height={22} radius={8} />
            <SkeletonLine width="28%" height={12} />
          </View>
        </>
      ) : (
        <View style={styles.visitHeader}>
          <View style={styles.visitRow}>
            <SkeletonCircle size={VISIT_AVATAR} />
            <View style={styles.visitName}>
              <SkeletonLine width="72%" height={20} radius={8} />
              <SkeletonLine width="44%" height={14} />
            </View>
          </View>
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.favGrid}>
          {[0, 1, 2, 3].map(key => (
            <View
              key={key}
              style={[
                styles.favCard,
                { backgroundColor: theme.colors.surfaceAlt },
              ]}>
              <SkeletonBlock width={30} height={30} radius={8} />
              <View style={styles.favCopy}>
                <SkeletonLine width="70%" height={10} />
                <SkeletonLine width="88%" height={14} />
              </View>
            </View>
          ))}
        </View>
        {variant === 'hero' ? <SkeletonBlock height={38} radius={15} /> : null}
        <SkeletonLine width="32%" height={22} radius={8} />
        <SkeletonLine width="92%" height={16} />
        <SkeletonLine width="74%" height={16} />
        {variant === 'visit' ? (
          <View style={styles.photoRow}>
            {[0, 1, 2].map(key => (
              <View key={key} style={styles.photoTile}>
                <SkeletonBlock height={110} radius={12} />
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 1 },
  identity: {
    alignItems: 'center',
    gap: 8,
  },
  visitHeader: {
    paddingHorizontal: 16,
  },
  visitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  visitName: { flex: 1, gap: 8 },
  body: {
    paddingHorizontal: 10,
    paddingTop: 16,
    gap: 16,
  },
  favGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  favCard: {
    width: '48.5%',
    flexGrow: 1,
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favCopy: { flex: 1, gap: 6 },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  photoTile: { flex: 1 },
});

export default ProfileSkeleton;
