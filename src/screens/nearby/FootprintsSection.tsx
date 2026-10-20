import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { FootprintGroup, formatRelativeTime } from '../../api';
import { Icon, SheetModal, Typography } from '../../components';
import { useLocale } from '../../i18n';
import { useTheme } from '../../theme';

export type FootprintsStatus = 'loading' | 'no_location' | 'ready';

type Props = {
  items: FootprintGroup[];
  status: FootprintsStatus;
  windowHours: number;
  onOpen: (index: number) => void;
};

const BUBBLE = 68;

type BubbleProps = { group: FootprintGroup; onPress: () => void };

const FootprintBubble = React.memo(function FootprintBubble({ group, onPress }: BubbleProps) {
  const theme = useTheme();
  const cover = group.User.ProfileImage || group.Stories[0]?.MediaUrl;
  const firstName = group.User.FirstName || group.User.Username;
  return (
    <Pressable onPress={onPress} style={styles.bubble} accessibilityRole="button" accessibilityLabel={firstName}>
      <View style={[styles.ring, { borderColor: theme.colors.premium }]}>
        <View style={[styles.photo, { backgroundColor: theme.colors.surfaceAlt }]}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.fill} fadeDuration={0} resizeMode="cover" />
          ) : (
            <Icon name="footprints" size={theme.iconSize.lg} color={theme.colors.textMuted} />
          )}
        </View>
      </View>
      <Typography variant="caption" numberOfLines={1} style={styles.bubbleName}>
        {firstName}
      </Typography>
      <Typography variant="overline" color="textMuted" numberOfLines={1}>
        {formatRelativeTime(group.LastSharedAt)}
      </Typography>
    </Pressable>
  );
});

/** "Ayak İzi": stories shared here in the last hours by people who have left. */
export function FootprintsSection({ items, status, windowHours, onOpen }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const [allOpen, setAllOpen] = useState(false);

  return (
    <View style={{ gap: theme.space.sm }}>
      <View style={styles.headerRow}>
        <Icon name="footprints" size={theme.iconSize.sm} color={theme.colors.premium} />
        <Typography variant="title" style={styles.flex}>
          {t('nearby.footprints_title')}
        </Typography>
        {items.length > 0 ? (
          <Pressable onPress={() => setAllOpen(true)} hitSlop={8} accessibilityRole="button">
            <Typography variant="caption" color="primary">
              {t('nearby.see_all')}
            </Typography>
          </Pressable>
        ) : null}
      </View>

      {status === 'ready' && items.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: theme.space.md }}>
          {items.map((group, index) => (
            <FootprintBubble key={group.User.UserId} group={group} onPress={() => onOpen(index)} />
          ))}
        </ScrollView>
      ) : (
        <Typography variant="caption" color="textMuted">
          {status === 'no_location'
            ? t('nearby.footprints_no_location')
            : status === 'loading'
              ? t('nearby.footprints_loading')
              : t('nearby.footprints_empty').replace('{hours}', String(windowHours))}
        </Typography>
      )}

      <SheetModal visible={allOpen} title={t('nearby.footprints_title')} onClose={() => setAllOpen(false)}>
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
  flex: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bubble: { width: BUBBLE + 8, alignItems: 'center', gap: 2 },
  ring: {
    width: BUBBLE + 6,
    height: BUBBLE + 6,
    borderRadius: (BUBBLE + 6) / 2,
    borderWidth: 2.5,
    padding: 2,
  },
  photo: {
    flex: 1,
    borderRadius: BUBBLE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: { width: '100%', height: '100%' },
  bubbleName: { maxWidth: BUBBLE + 8 },
  allList: { maxHeight: 420 },
  allGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
});
