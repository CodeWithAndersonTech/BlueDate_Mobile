import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import { Avatar, Icon, Typography } from '../../components';
import { StoryItem, StoryUserGroup } from '../../api';
import { useLocale } from '../../i18n';

const PHOTO_MS = 5000;

type Props = {
  visible: boolean;
  groups: StoryUserGroup[];
  startGroupIndex: number;
  viewerUserId: number;
  onClose: () => void;
  onDelete?: (story: StoryItem) => void;
  onOpenProfile?: (userId: number) => void;
};

function userLabel(group: StoryUserGroup) {
  const name = `${group.User.FirstName} ${group.User.LastName}`.trim();
  return name || group.User.Username || '?';
}

export function StoryViewer({
  visible,
  groups,
  startGroupIndex,
  viewerUserId,
  onClose,
  onDelete,
  onOpenProfile,
}: Props) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const [groupIndex, setGroupIndex] = useState(startGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeGroups = useMemo(
    () => groups.filter(g => g.Stories.length > 0),
    [groups],
  );

  const group = activeGroups[groupIndex];
  const story = group?.Stories[storyIndex];
  const isOwner = story?.UserId === viewerUserId;
  const otherGroups = activeGroups.filter(
    g => g.User.UserId !== group?.User.UserId,
  );

  useEffect(() => {
    if (!visible) return;
    setGroupIndex(
      Math.min(Math.max(0, startGroupIndex), Math.max(0, activeGroups.length - 1)),
    );
    setStoryIndex(0);
    setProgress(0);
  }, [visible, startGroupIndex, activeGroups.length]);

  useEffect(() => {
    if (!visible || !story) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setProgress(0);

    if (story.MediaType === 'video') {
      return;
    }

    const started = Date.now();
    timerRef.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - started) / PHOTO_MS);
      setProgress(p);
      if (p >= 1) {
        goNext();
      }
    }, 50);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, groupIndex, storyIndex, story?.Id]);

  if (!visible || !group || !story) {
    return null;
  }

  function goNext() {
    if (!group) return;
    if (storyIndex < group.Stories.length - 1) {
      setStoryIndex(i => i + 1);
      return;
    }
    if (groupIndex < activeGroups.length - 1) {
      setGroupIndex(i => i + 1);
      setStoryIndex(0);
      return;
    }
    onClose();
  }

  function goPrev() {
    if (storyIndex > 0) {
      setStoryIndex(i => i - 1);
      return;
    }
    if (groupIndex > 0) {
      const prev = activeGroups[groupIndex - 1];
      setGroupIndex(i => i - 1);
      setStoryIndex(Math.max(0, (prev?.Stories.length ?? 1) - 1));
      return;
    }
    setProgress(0);
  }

  function openGroupStories(userId: number) {
    const idx = activeGroups.findIndex(g => g.User.UserId === userId);
    if (idx < 0) return;
    setGroupIndex(idx);
    setStoryIndex(0);
    setProgress(0);
  }

  return (
    <View style={styles.root}>
      {/* Full-bleed media behind chrome */}
      <View style={styles.mediaWrap}>
        {story.MediaType === 'video' ? (
          <Video
            key={story.Id}
            source={{ uri: story.MediaUrl }}
            style={styles.media}
            resizeMode="cover"
            controls={false}
            paused={false}
            onProgress={({ currentTime, seekableDuration }) => {
              if (seekableDuration > 0) {
                setProgress(Math.min(1, currentTime / seekableDuration));
              }
            }}
            onEnd={goNext}
            onError={goNext}
          />
        ) : (
          <Image
            key={story.Id}
            source={{ uri: story.MediaUrl }}
            style={styles.media}
            resizeMode="cover"
          />
        )}
        {story.Caption ? (
          <View style={[styles.caption, { bottom: insets.bottom + 24 }]}>
            <Typography variant="body" tint="#fff" align="center">
              {story.Caption}
            </Typography>
          </View>
        ) : null}
      </View>

      <View style={styles.tapZones} pointerEvents="box-none">
        <Pressable style={styles.tapLeft} onPress={goPrev} />
        <Pressable style={styles.tapRight} onPress={goNext} />
      </View>

      {/* Overlay chrome — does not push media down */}
      <View
        style={styles.top}
        pointerEvents="box-none">
        <View style={styles.bars}>
          {group.Stories.map((s, i) => (
            <View key={s.Id} style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width:
                      i < storyIndex
                        ? '100%'
                        : i === storyIndex
                          ? `${Math.round(progress * 100)}%`
                          : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.headerRow} pointerEvents="box-none">
          <View style={styles.userBlock} pointerEvents="box-none">
            <Pressable
              style={styles.userRow}
              onPress={() => onOpenProfile?.(group.User.UserId)}
              disabled={!onOpenProfile}
              hitSlop={6}>
              <Avatar
                uri={group.User.ProfileImage ?? undefined}
                name={userLabel(group)}
                size="sm"
              />
              <Typography variant="bodyStrong" tint="#fff" numberOfLines={1}>
                {userLabel(group)}
              </Typography>
            </Pressable>

            {otherGroups.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.friendsRow}
                keyboardShouldPersistTaps="handled">
                {otherGroups.map(g => (
                  <Pressable
                    key={g.User.UserId}
                    onPress={() => onOpenProfile?.(g.User.UserId)}
                    onLongPress={() => openGroupStories(g.User.UserId)}
                    style={styles.friendAvatar}
                    accessibilityLabel={userLabel(g)}>
                    <View style={styles.friendRing}>
                      <Avatar
                        uri={g.User.ProfileImage ?? undefined}
                        name={userLabel(g)}
                        size="xs"
                      />
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
          </View>

          <View style={styles.headerActions}>
            {isOwner && onDelete ? (
              <Pressable
                onPress={() => onDelete(story)}
                hitSlop={10}
                accessibilityLabel={t('stories.delete')}>
                <Icon name="trash" size={20} color="#fff" />
              </Pressable>
            ) : null}
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityLabel={t('common.close')}>
              <Icon name="close" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
    backgroundColor: '#000',
  },
  mediaWrap: {
    ...StyleSheet.absoluteFill,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 0,
    paddingHorizontal: 12,
    zIndex: 3,
  },
  bars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 0,
  },
  barTrack: {
    flex: 1,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  userBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '55%',
  },
  friendsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 4,
  },
  friendAvatar: {
    borderRadius: 999,
  },
  friendRing: {
    padding: 1.5,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexShrink: 0,
  },
  caption: {
    position: 'absolute',
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  tapZones: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    zIndex: 1,
  },
  tapLeft: {
    flex: 1,
  },
  tapRight: {
    flex: 1,
  },
});
