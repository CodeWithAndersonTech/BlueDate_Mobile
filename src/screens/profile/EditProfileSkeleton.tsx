import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import {
  SkeletonBlock,
  SkeletonLine,
} from '../../components/skeleton/SkeletonBone';

const SAVE_BTN_HEIGHT = 54;
const PHOTO_TILE_W = 149;
const PHOTO_TILE_H = 173;

type Props = {
  visible?: boolean;
};

/** Edit Profile skeleton — basics, photo rail, favorites, save bar. */
export function EditProfileSkeleton({ visible = true }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.quad),
    });
  }, [visible, opacity]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.root, fadeStyle]} pointerEvents="none">
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <View style={styles.cardHead}>
            <SkeletonBlock width={20} height={20} radius={6} />
            <SkeletonLine width={110} height={15} />
          </View>
          {[0, 1, 2, 3, 4].map(key => (
            <View key={key} style={styles.infoRow}>
              <SkeletonLine width={100} height={13} />
              <SkeletonLine width="46%" height={15} />
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <View style={styles.cardHead}>
            <SkeletonBlock width={20} height={20} radius={6} />
            <SkeletonLine width={88} height={15} />
            <View style={styles.flex} />
            <SkeletonBlock width={43} height={18} radius={8} />
          </View>
          <View style={styles.photoRail}>
            {[0, 1].map(key => (
              <SkeletonBlock
                key={key}
                width={PHOTO_TILE_W}
                height={PHOTO_TILE_H}
                radius={10}
              />
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <View style={styles.cardHead}>
            <SkeletonBlock width={20} height={20} radius={6} />
            <SkeletonLine width={96} height={15} />
          </View>
          {[0, 1, 2, 3].map(key => (
            <View key={key} style={styles.favRow}>
              <SkeletonBlock width={30} height={30} radius={8} />
              <View style={styles.favText}>
                <SkeletonLine width={72} height={11} />
                <SkeletonLine width="58%" height={15} />
              </View>
              <SkeletonBlock width={62} height={27} radius={8} />
            </View>
          ))}
        </View>
      </View>

      <View
        style={[
          styles.saveBar,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
        ]}>
        <SkeletonBlock height={SAVE_BTN_HEIGHT} radius={999} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 0,
    gap: 10,
  },
  card: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
    gap: 6,
  },
  photoRail: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 4,
  },
  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    gap: 10,
  },
  favText: { flex: 1, gap: 4 },
  saveBar: {
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

export default EditProfileSkeleton;
