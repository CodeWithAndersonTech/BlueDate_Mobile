import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Avatar, Icon, Typography } from '../../components';
import { StoryUserGroup } from '../../api';
import { useLocale } from '../../i18n';
import { useTheme } from '../../theme';

const RING: [string, string, string] = ['#F58529', '#DD2A7B', '#8134AF'];
const RING_EMPTY: [string, string] = ['#C7C7CC', '#C7C7CC'];

type Props = {
  ownUserId: number;
  ownAvatarUri?: string;
  ownName: string;
  groups: StoryUserGroup[];
  onAddStory: () => void;
  onAddFromGallery: () => void;
  onOpenUser: (userId: number) => void;
};

function displayLabel(group: StoryUserGroup) {
  const first = group.User.FirstName?.trim();
  if (first) return first;
  return group.User.Username || '?';
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
  const theme = useTheme();
  const { t } = useLocale();

  const ownGroup = groups.find(g => g.User.UserId === ownUserId);
  const ownHasStory = (ownGroup?.Stories.length ?? 0) > 0;
  const friendGroups = groups.filter(
    g => g.User.UserId !== ownUserId && g.Stories.length > 0,
  );

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        <Pressable
          onPress={ownHasStory ? () => onOpenUser(ownUserId) : onAddStory}
          onLongPress={onAddFromGallery}
          style={styles.item}
          accessibilityRole="button"
          accessibilityLabel={t('stories.your_story')}>
          <LinearGradient
            colors={ownHasStory ? RING : RING_EMPTY}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.ring}>
            <View
              style={[
                styles.ringInner,
                { backgroundColor: theme.colors.background },
              ]}>
              <Avatar uri={ownAvatarUri} name={ownName || '?'} size="md" />
            </View>
          </LinearGradient>
          <Pressable
            onPress={onAddStory}
            onLongPress={onAddFromGallery}
            style={[
              styles.addBadge,
              {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.background,
              },
            ]}
            hitSlop={8}
            accessibilityLabel={t('stories.add')}>
            <Icon name="plus" size={12} color={theme.colors.onPrimary} />
          </Pressable>
          <Typography variant="caption" numberOfLines={1} style={styles.label}>
            {t('stories.your_story')}
          </Typography>
        </Pressable>

        {friendGroups.map(group => (
          <Pressable
            key={group.User.UserId}
            onPress={() => onOpenUser(group.User.UserId)}
            style={styles.item}
            accessibilityRole="button"
            accessibilityLabel={displayLabel(group)}>
            <LinearGradient
              colors={RING}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.ring}>
              <View
                style={[
                  styles.ringInner,
                  { backgroundColor: theme.colors.background },
                ]}>
                <Avatar
                  uri={group.User.ProfileImage ?? undefined}
                  name={displayLabel(group)}
                  size="md"
                />
              </View>
            </LinearGradient>
            <Typography
              variant="caption"
              numberOfLines={1}
              style={styles.label}>
              {displayLabel(group)}
            </Typography>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
  },
  row: {
    paddingVertical: 4,
    gap: 14,
    paddingRight: 8,
  },
  item: {
    width: 72,
    alignItems: 'center',
  },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBadge: {
    position: 'absolute',
    right: 4,
    top: 42,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 6,
    width: '100%',
    textAlign: 'center',
  },
});
