import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Video from 'react-native-video';
import {
  Avatar,
  FigmaIcon,
  FigmaSpinner,
  SafeOverlay,
  Typography,
} from '../../components';
import { StoryItem, StoryUserGroup } from '../../api';
import { useLocale } from '../../i18n';

const PHOTO_MS = 5000;
const { height: SCREEN_H } = Dimensions.get('window');
const DISMISS_Y = 120;

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

function StoryChromeButton({
  onPress,
  label,
  children,
}: {
  onPress: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={styles.chromeBtn}>
      {children}
    </Pressable>
  );
}

function CloseGlyph() {
  return (
    <View style={styles.xWrap}>
      <View style={[styles.xBar, { transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.xBar, { transform: [{ rotate: '-45deg' }] }]} />
    </View>
  );
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
  const topPad = Math.max(
    insets.top,
    initialWindowMetrics?.insets.top ?? 0,
    47,
  );
  const [groupIndex, setGroupIndex] = useState(startGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [readyForId, setReadyForId] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const translateY = useSharedValue(0);
  const backdrop = useSharedValue(1);

  const activeGroups = useMemo(
    () => groups.filter(g => g.Stories.length > 0),
    [groups],
  );

  const group = activeGroups[groupIndex];
  const story = group?.Stories[storyIndex];
  const mediaReady = story != null && readyForId === story.Id;
  const isOwner = Number(story?.UserId) === Number(viewerUserId);
  const otherGroups = activeGroups.filter(
    g => g.User.UserId !== group?.User.UserId,
  );

  const dismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!visible) return;
    setGroupIndex(
      Math.min(Math.max(0, startGroupIndex), Math.max(0, activeGroups.length - 1)),
    );
    setStoryIndex(0);
    setProgress(0);
    setPaused(false);
    setReadyForId(null);
    translateY.value = 0;
    backdrop.value = 1;
  }, [visible, startGroupIndex, activeGroups.length, backdrop, translateY]);

  useEffect(() => {
    if (!story?.MediaUrl) {
      return;
    }
    if (story.MediaType === 'photo') {
      void Image.prefetch(story.MediaUrl).catch(() => undefined);
    }
    const next = group?.Stories[storyIndex + 1];
    if (next?.MediaType === 'photo' && next.MediaUrl) {
      void Image.prefetch(next.MediaUrl).catch(() => undefined);
    }
  }, [story?.Id, story?.MediaUrl, story?.MediaType, group, storyIndex]);

  useEffect(() => {
    if (!visible || !story || paused || !mediaReady) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

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
  }, [visible, groupIndex, storyIndex, story?.Id, paused, mediaReady]);

  const pan = Gesture.Pan()
    .activeOffsetY(14)
    .failOffsetX([-30, 30])
    .onBegin(() => {
      runOnJS(setPaused)(true);
    })
    .onUpdate(e => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd(e => {
      const shouldDismiss =
        translateY.value > DISMISS_Y || e.velocityY > 1100;
      if (shouldDismiss) {
        backdrop.value = withTiming(0, { duration: 160 });
        translateY.value = withTiming(
          SCREEN_H,
          { duration: 200, easing: Easing.out(Easing.cubic) },
          finished => {
            if (finished) {
              runOnJS(dismiss)();
            }
          },
        );
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 260 });
        runOnJS(setPaused)(false);
      }
    })
    .onFinalize((_e, success) => {
      // If gesture cancelled without end dismiss path, resume playback.
      if (!success && translateY.value < DISMISS_Y) {
        runOnJS(setPaused)(false);
      }
    });

  const sheetStyle = useAnimatedStyle(() => {
    const drag = interpolate(
      translateY.value,
      [0, DISMISS_Y * 1.8],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateY: translateY.value },
        { scale: interpolate(drag, [0, 1], [1, 0.92]) },
      ],
      borderRadius: interpolate(drag, [0, 1], [0, 18]),
      overflow: 'hidden' as const,
      opacity: interpolate(drag, [0, 1], [1, 0.75]),
    };
  });

  const rootStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0,0,0,${interpolate(
      translateY.value,
      [0, DISMISS_Y * 1.6],
      [1, 0.25],
      Extrapolation.CLAMP,
    ) * backdrop.value})`,
  }));

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
    <SafeOverlay visible={visible} onRequestClose={dismiss}>
    <GestureHandlerRootView style={styles.root}>
      <StatusBar
        hidden
        animated
        barStyle="light-content"
        backgroundColor="#000"
        translucent
      />
      <Animated.View style={[styles.rootFill, rootStyle]}>
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.sheet, sheetStyle]}>
            <View style={styles.mediaWrap}>
              {story.MediaType === 'video' ? (
                <Video
                  key={story.Id}
                  source={{ uri: story.MediaUrl }}
                  style={styles.media}
                  resizeMode="cover"
                  controls={false}
                  paused={paused || !mediaReady}
                  onLoad={() => setReadyForId(story.Id)}
                  onReadyForDisplay={() => setReadyForId(story.Id)}
                  onProgress={({ currentTime, seekableDuration }) => {
                    if (!mediaReady || seekableDuration <= 0) {
                      return;
                    }
                    setProgress(Math.min(1, currentTime / seekableDuration));
                  }}
                  onEnd={goNext}
                />
              ) : (
                <Image
                  key={story.Id}
                  source={{ uri: story.MediaUrl }}
                  style={styles.media}
                  resizeMode="cover"
                  fadeDuration={0}
                  onLoad={() => setReadyForId(story.Id)}
                />
              )}
              {!mediaReady ? (
                <View style={styles.mediaGate} pointerEvents="none">
                  <FigmaSpinner size={32} color="#fff" />
                </View>
              ) : null}
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

            <View
              style={[styles.top, { paddingTop: topPad + 6 }]}
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
                    <Typography
                      variant="bodyStrong"
                      tint="#fff"
                      numberOfLines={1}>
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
                    <StoryChromeButton
                      onPress={() => onDelete(story)}
                      label={t('stories.delete')}>
                      <FigmaIcon name="trash" size={20} color="#fff" />
                    </StoryChromeButton>
                  ) : null}
                  <StoryChromeButton
                    onPress={onClose}
                    label={t('common.close')}>
                    <CloseGlyph />
                  </StoryChromeButton>
                </View>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </GestureHandlerRootView>
    </SafeOverlay>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  rootFill: {
    flex: 1,
    backgroundColor: '#000',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#000',
  },
  mediaWrap: {
    ...StyleSheet.absoluteFill,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  mediaGate: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
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
    marginBottom: 10,
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
    gap: 10,
    flexShrink: 0,
  },
  chromeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  xWrap: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xBar: {
    position: 'absolute',
    width: 16,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#fff',
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
