import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { StoryAvatar, Typography } from '../../components';
import { isStoryGroupForUser, StoryUserGroup } from '../../api';
import { useLocale } from '../../i18n';
import { useTheme } from '../../theme';

const OUTER = 75;
const PLUS = 22;

type Props = {
  ownUserId: number;
  ownAvatarUri?: string;
  ownName: string;
  groups: StoryUserGroup[];
  onAddStory: () => void;
  onAddFromGallery: () => void;
  onOpenUser: (userId: number) => void;
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function displayLabel(group: StoryUserGroup) {
  return group.User.Username || group.User.FirstName || '?';
}

function StoryBubble({
  uri,
  fallback,
  label,
  hasStory,
  onPress,
  onLongPress,
  accessibilityLabel,
}: {
  uri?: string;
  fallback?: string;
  label: string;
  hasStory: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.item}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      <StoryAvatar
        uri={uri}
        size={OUTER}
        hasStory={hasStory}
        fallback={fallback}
      />
      <Typography
        variant="caption"
        color="textMuted"
        numberOfLines={1}
        align="center"
        style={styles.label}>
        {label}
      </Typography>
    </Pressable>
  );
}

export function StoryRail({
  ownUserId,
  ownAvatarUri,
  ownName,
  groups,
  onAddStory,
  onAddFromGallery,
  onOpenUser,
}: Props) {
  const { t } = useLocale();
  const theme = useTheme();

  const ownGroup = groups.find(g => isStoryGroupForUser(g, ownUserId));
  const ownHasStory = (ownGroup?.Stories.length ?? 0) > 0;
  const ownFace =
    ownAvatarUri || ownGroup?.User.ProfileImage || undefined;
  const friendGroups = groups.filter(
    g => !isStoryGroupForUser(g, ownUserId) && g.Stories.length > 0,
  );

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        <View style={styles.ownSlot}>
          <StoryBubble
            uri={ownFace}
            fallback={initialsFromName(ownName)}
            label={t('stories.your_story')}
            hasStory={ownHasStory}
            onPress={ownHasStory ? () => onOpenUser(ownUserId) : onAddStory}
            onLongPress={onAddFromGallery}
            accessibilityLabel={t('stories.your_story')}
          />
          <Pressable
            onPress={onAddStory}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={t('stories.add')}
            style={styles.plusHit}>
            <View
              style={[
                styles.plusBadge,
                {
                  backgroundColor: theme.colors.plusCta,
                  borderColor: theme.colors.background,
                },
              ]}>
              <View
                style={[styles.plusBarH, { backgroundColor: theme.colors.white }]}
              />
              <View
                style={[styles.plusBarV, { backgroundColor: theme.colors.white }]}
              />
            </View>
          </Pressable>
        </View>
        {friendGroups.map(group => (
          <StoryBubble
            key={group.User.UserId}
            uri={group.User.ProfileImage ?? undefined}
            label={displayLabel(group)}
            hasStory
            onPress={() => onOpenUser(group.User.UserId)}
            accessibilityLabel={displayLabel(group)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 10,
    paddingRight: 8,
  },
  ownSlot: {
    width: OUTER,
    position: 'relative',
  },
  plusHit: {
    position: 'absolute',
    right: 0,
    top: OUTER - PLUS + 2,
    width: PLUS,
    height: PLUS,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  plusBadge: {
    width: PLUS,
    height: PLUS,
    borderRadius: PLUS / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBarH: {
    position: 'absolute',
    width: 10,
    height: 2,
    borderRadius: 1,
  },
  plusBarV: {
    position: 'absolute',
    width: 2,
    height: 10,
    borderRadius: 1,
  },
  item: {
    width: OUTER,
    alignItems: 'center',
    gap: 5,
  },
  label: { maxWidth: OUTER },
});
