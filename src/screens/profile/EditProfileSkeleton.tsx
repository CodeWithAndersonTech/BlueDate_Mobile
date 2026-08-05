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

const TILE_HEIGHT = 100;
const SAVE_BTN_HEIGHT = 54;

type Props = {
  visible?: boolean;
};

/**
 * Edit Profile skeleton — account card, bio field, interest tiles, save bar.
 */
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
      <View style={styles.header}>
        <SkeletonLine width={120} height={17} radius={8} />
      </View>

      <View style={styles.content}>
        <SkeletonLine width={64} height={10} style={styles.sectionLabel} />
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.card },
            theme.shadows.sm,
          ]}>
          {[0, 1, 2, 3].map((key, index) => (
            <View key={key}>
              <View style={styles.infoRow}>
                <View style={styles.infoText}>
                  <SkeletonLine width={72} height={11} />
                  <SkeletonLine width="58%" height={15} style={styles.infoValue} />
                </View>
                <SkeletonLine width={14} height={14} radius={4} />
              </View>
              {index < 3 ? (
                <View
                  style={[
                    styles.sep,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
              ) : null}
            </View>
          ))}
        </View>
        <SkeletonLine width="88%" height={11} style={styles.hint} />

        <SkeletonLine
          width={56}
          height={10}
          style={[styles.sectionLabel, styles.bioLabel]}
        />
        <SkeletonBlock height={110} radius={16} />
        <SkeletonLine width={40} height={11} style={styles.bioCounter} />

        <View style={styles.sectionHead}>
          <View style={styles.sectionHeadText}>
            <SkeletonLine width={96} height={11} />
            <SkeletonLine width="78%" height={11} style={styles.hintTight} />
          </View>
          <SkeletonBlock width={64} height={24} radius={999} />
        </View>

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
                <SkeletonLine width={18} height={18} radius={9} />
              </View>
              <SkeletonLine width="68%" height={10} />
              <SkeletonLine width="86%" height={13} style={styles.tileValue} />
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
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 4,
    minHeight: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 24,
  },
  sectionLabel: { marginBottom: 8 },
  bioLabel: { marginTop: 22 },
  card: { borderRadius: 16, overflow: 'hidden' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  infoText: { flex: 1, gap: 6 },
  infoValue: { marginTop: 0 },
  sep: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  hint: { marginTop: 8, marginBottom: 4 },
  hintTight: { marginTop: 6 },
  bioCounter: { alignSelf: 'flex-end', marginTop: 6 },
  sectionHead: {
    marginTop: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionHeadText: { flex: 1, gap: 2 },
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
  saveBar: {
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

export default EditProfileSkeleton;
