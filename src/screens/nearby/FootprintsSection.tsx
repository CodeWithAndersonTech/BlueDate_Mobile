import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { FootprintGroup } from '../../api';
import { FigmaIcon, SheetModal, Typography } from '../../components';
import { useLocale } from '../../i18n';
import { useTheme } from '../../theme';

export type FootprintsStatus = 'loading' | 'no_location' | 'ready';

type Props = {
  items: FootprintGroup[];
  status: FootprintsStatus;
  windowHours: number;
  onOpen: (index: number) => void;
  onSeeAll?: () => void;
};

const OUTER = 75;
const PHOTO = 66;

type BubbleProps = { group: FootprintGroup; onPress: () => void };

const FootprintBubble = React.memo(function FootprintBubble({
  group,
  onPress,
}: BubbleProps) {
  const theme = useTheme();
  const cover = group.User.ProfileImage || group.Stories[0]?.MediaUrl;
  const label = group.User.Username || group.User.FirstName;
  return (
    <Pressable
      onPress={onPress}
      style={styles.bubble}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <LinearGradient
        colors={theme.gradients.storyRing}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.ring}>
        <View
          style={[styles.photo, { backgroundColor: theme.colors.surfaceAlt }]}>
          {cover ? (
            <Image
              source={{ uri: cover }}
              style={styles.fill}
              fadeDuration={0}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.fallback}>
              <FigmaIcon name="footprints" size={theme.iconSize.md} />
            </View>
          )}
        </View>
      </LinearGradient>
      <Typography variant="caption" numberOfLines={1} align="center" style={styles.bubbleName}>
        {label}
      </Typography>
    </Pressable>
  );
});

/** "Ayak İzi": stories shared here in the last hours by people who have left. */
export function FootprintsSection({
  items,
  status,
  windowHours,
  onOpen,
}: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const [allOpen, setAllOpen] = useState(false);

  return (
    <View>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <FigmaIcon name="footprints" size={20} />
          <Typography variant="callout" weight="600">
            {t('nearby.footprints_title')}
          </Typography>
        </View>
        {items.length > 0 ? (
          <Pressable
            onPress={() => setAllOpen(true)}
            hitSlop={8}
            accessibilityRole="button">
            <Typography variant="caption" color="premium" weight="600">
              {t('nearby.see_all')}
            </Typography>
          </Pressable>
        ) : null}
      </View>

      {status === 'ready' && items.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}>
          {items.map((group, index) => (
            <FootprintBubble
              key={group.User.UserId}
              group={group}
              onPress={() => onOpen(index)}
            />
          ))}
        </ScrollView>
      ) : (
        <Typography variant="caption" color="textMuted">
          {status === 'no_location'
            ? t('nearby.footprints_no_location')
            : status === 'loading'
              ? t('nearby.footprints_loading')
              : t('nearby.footprints_empty').replace(
                  '{hours}',
                  String(windowHours),
                )}
        </Typography>
      )}

      <SheetModal
        visible={allOpen}
        title={t('nearby.footprints_title')}
        onClose={() => setAllOpen(false)}>
        <ScrollView style={styles.allList} contentContainerStyle={styles.allGrid}>
          {items.map((group, index) => (
            <FootprintBubble
              key={group.User.UserId}
              group={group}
              onPress={() => {
                setAllOpen(false);
                onOpen(index);
              }}
            />
          ))}
        </ScrollView>
      </SheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  rail: { gap: 10 },
  bubble: { width: OUTER, alignItems: 'center', gap: 5 },
  ring: {
    width: OUTER,
    height: OUTER,
    borderRadius: OUTER / 2,
    padding: (OUTER - PHOTO) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: PHOTO,
    height: PHOTO,
    borderRadius: PHOTO / 2,
    overflow: 'hidden',
  },
  fill: { width: '100%', height: '100%' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bubbleName: { maxWidth: OUTER },
  allList: { maxHeight: 420 },
  allGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
});
