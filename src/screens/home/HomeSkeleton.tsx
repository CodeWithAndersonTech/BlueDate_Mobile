import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TabScreenScrollView, useScreenTopPad } from '../../components';
import {
  SkeletonBlock,
  SkeletonCircle,
  SkeletonLine,
} from '../../components/skeleton/SkeletonBone';
import { useTheme } from '../../theme';

const STORY = 75;

/** Home skeleton — story rail, Plus/Nearby cards, activity list. */
export function HomeSkeleton() {
  const theme = useTheme();
  const topPad = useScreenTopPad();

  return (
    <TabScreenScrollView
      bottomSpacing={40}
      scrollEnabled={false}
      pointerEvents="none"
      contentContainerStyle={[styles.content, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <SkeletonCircle size={25} />
        <View style={styles.headerActions}>
          <SkeletonCircle size={25} />
          <SkeletonCircle size={24} />
        </View>
      </View>

      <View style={styles.rail}>
        {[0, 1, 2, 3, 4].map(key => (
          <View key={key} style={styles.story}>
            <SkeletonCircle size={STORY} />
            <SkeletonLine width={52} height={10} />
          </View>
        ))}
      </View>

      <SkeletonBlock height={158} radius={15} />
      <SkeletonBlock height={168} radius={15} />

      <View
        style={[
          styles.activity,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}>
        <SkeletonLine width="42%" height={18} radius={8} />
        {[0, 1, 2].map(key => (
          <View key={key} style={styles.activityRow}>
            <SkeletonCircle size={40} />
            <View style={styles.activityCopy}>
              <SkeletonLine width="88%" height={14} />
              <SkeletonLine width="34%" height={11} />
            </View>
          </View>
        ))}
      </View>
    </TabScreenScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 10,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rail: {
    flexDirection: 'row',
    gap: 10,
  },
  story: {
    width: STORY,
    alignItems: 'center',
    gap: 6,
  },
  activity: {
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityCopy: {
    flex: 1,
    gap: 6,
  },
});
