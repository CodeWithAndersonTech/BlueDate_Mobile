import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { images } from '../../assets';
import {
  FigmaButton,
  FigmaIcon,
  TabScreenScrollView,
  Typography,
  useScreenTopPad,
} from '../../components';
import {
  createStory,
  deleteStory,
  getStoriesByUser,
  getStoryFeed,
  getUserProfile,
  isStoryGroupForUser,
  resolveMediaUrl,
  resolveStoryMediaUrls,
  StoryItem,
  StoryUserGroup,
} from '../../api';
import { useLocale } from '../../i18n';
import { usePremium } from '../../hooks/usePremium';
import { useAuth } from '../../navigation/AuthContext';
import { useNotifications } from '../../navigation/NotificationsContext';
import { useHideTabBar } from '../../navigation/useHideTabBar';
import { HomeStackParamList } from '../../navigation/types';
import {
  loadProfilePhotos,
  peekCachedAvatar,
  preferDisplayAvatar,
  rememberAvatar,
} from '../../services/photos/photoStore';
import { prefetchMediaUris } from '../../services/photos/prefetchMedia';
import {
  pickStoryMediaFromCamera,
  pickStoryMediaFromLibrary,
  type PickedStoryAsset,
  type StoryPickResult,
} from '../../services/stories/pickStoryMedia';
import { getCurrentCoordinates } from '../../services/location/currentPosition';
import { useTheme } from '../../theme';
import { useOpenNotification } from '../notifications/notificationMeta';
import { openFriendProfile } from '../../services/profile/visitCache';
import { HomeActivityRow } from './HomeActivityRow';
import { HomeSkeleton } from './HomeSkeleton';
import { StoryComposeOverlay } from './StoryComposeOverlay';
import { StoryRail } from './StoryRail';
import { StoryViewer } from './StoryViewer';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeFeed'>;

const HOME_STALE_MS = 25_000;
const STORY_POLL_MS = 7_000;

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const topPad = useScreenTopPad();
  const { width: screenW } = useWindowDimensions();
  const cardW = Math.max(320, screenW - 20);
  const plusArt = Math.round(Math.min(132, cardW * 0.34));
  const radarArt = Math.round(Math.min(168, cardW * 0.42));
  const starSize = plusArt >= 120 ? 16 : 13;
  const { userId, accessToken } = useAuth();
  const {
    items: notifications,
    unreadCount: unreadNotifications,
    refresh: refreshNotifications,
  } = useNotifications();
  const openNotification = useOpenNotification();
  const activityFeed = notifications.filter(
    n => n.type !== 'like' && n.type !== 'match',
  );
  const recentActivity = activityFeed.slice(0, 3);
  const hasMoreActivity = activityFeed.length > 3;
  const { isPremium, refresh: refreshPremium } = usePremium();
  const [firstName, setFirstName] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | undefined>(() =>
    peekCachedAvatar(userId),
  );
  const avatarUriRef = useRef(avatarUri);
  avatarUriRef.current = avatarUri;
  const [storyGroups, setStoryGroups] = useState<StoryUserGroup[]>([]);
  const [composeAsset, setComposeAsset] = useState<PickedStoryAsset | null>(
    null,
  );
  const [composeVisible, setComposeVisible] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const [ready, setReady] = useState(false);
  useHideTabBar(composeVisible || viewerVisible);
  const goToTab = useCallback(
    (tab: string) => navigation.getParent()?.navigate(tab as never),
    [navigation],
  );
  const lastHomeFetchAt = useRef(0);
  const readyRef = useRef(false);
  const storyGroupsRef = useRef(storyGroups);
  storyGroupsRef.current = storyGroups;

  const applyStories = useCallback((next: StoryUserGroup[] | null) => {
    if (!next) return;
    setStoryGroups(next);
    void prefetchMediaUris(
      next.flatMap(g =>
        g.Stories.filter(s => s.MediaType === 'photo')
          .slice(0, 1)
          .map(s => s.MediaUrl),
      ),
      1200,
    );
  }, []);

  const refreshStories = useCallback(async () => {
    if (!userId) return null;
    try {
      const feed = await getStoryFeed(userId, accessToken);
      return await resolveStoryMediaUrls(feed.Items);
    } catch {
      return null;
    }
  }, [userId, accessToken]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        readyRef.current = true;
        setReady(true);
        return;
      }
      let cancelled = false;
      const firstPaint = !readyRef.current;
      const fresh =
        lastHomeFetchAt.current > 0 &&
        Date.now() - lastHomeFetchAt.current < HOME_STALE_MS;

      const pullStories = () => {
        void refreshStories().then(next => {
          if (!cancelled) applyStories(next);
        });
      };

      if (!fresh || firstPaint) {
        void (async () => {
          lastHomeFetchAt.current = Date.now();
          void refreshNotifications();
          void refreshPremium();
          try {
            const [profile, photoBundle, stories] = await Promise.all([
              getUserProfile(userId, accessToken),
              loadProfilePhotos(userId, accessToken).catch(() => ({
                gallery: [],
                avatarUri: undefined as string | undefined,
              })),
              refreshStories(),
            ]);
            if (cancelled) return;

            const profileAvatar = await resolveMediaUrl(
              profile.ProfileImage,
            ).catch(() => undefined);
            const nextAvatar = preferDisplayAvatar(
              photoBundle.avatarUri,
              profileAvatar,
              peekCachedAvatar(userId),
              avatarUriRef.current,
            );
            if (nextAvatar) {
              rememberAvatar(userId, nextAvatar);
              setAvatarUri(nextAvatar);
            }
            const nextStories = stories ?? storyGroupsRef.current;
            if (firstPaint) {
              void prefetchMediaUris([
                nextAvatar,
                ...nextStories.map(g => g.User.ProfileImage),
                ...nextStories.flatMap(g =>
                  g.Stories.filter(s => s.MediaType === 'photo')
                    .slice(0, 1)
                    .map(s => s.MediaUrl),
                ),
              ]);
            }
            if (cancelled) return;

            const name = `${profile.FirstName} ${profile.LastName}`.trim();
            setFirstName(profile.FirstName?.trim() || profile.Username || '');
            setFullName(name || profile.Username || '');
            applyStories(stories);
            readyRef.current = true;
            setReady(true);
          } catch {
            if (!cancelled) {
              readyRef.current = true;
              setReady(true);
            }
          }
        })();
      } else {
        pullStories();
      }

      const poll = setInterval(pullStories, STORY_POLL_MS);

      return () => {
        cancelled = true;
        clearInterval(poll);
      };
    }, [
      userId,
      accessToken,
      refreshNotifications,
      refreshPremium,
      refreshStories,
      applyStories,
    ]),
  );

  const openComposeWithPick = useCallback(
    (picked: StoryPickResult) => {
      if (picked.didCancel) return false;
      if (!picked.asset) {
        Alert.alert(
          t('stories.error_title'),
          picked.errorMessage === 'NATIVE_MODULE_MISSING'
            ? t('stories.picker_missing')
            : t('stories.pick_error'),
        );
        return false;
      }
      setComposeAsset(picked.asset);
      setComposeVisible(true);
      return true;
    },
    [t],
  );

  const handlePickFromGallery = useCallback(async () => {
    const picked = await pickStoryMediaFromLibrary();
    openComposeWithPick(picked);
  }, [openComposeWithPick]);

  const handleAddStory = useCallback(async () => {
    const picked = await pickStoryMediaFromCamera();
    if (picked.didCancel) return;
    openComposeWithPick(picked);
  }, [openComposeWithPick]);

  const handleShareStory = useCallback(async () => {
    if (!userId || !composeAsset) return;
    setUploadingStory(true);
    try {
      const coords = await getCurrentCoordinates(5000);
      const created = await createStory(
        userId,
        composeAsset,
        undefined,
        accessToken,
        coords,
      );
      setComposeVisible(false);
      setComposeAsset(null);
      applyStories(await refreshStories());
      const posted = await resolveMediaUrl(created.MediaUrl);
      if (posted) {
        void Image.prefetch(posted).catch(() => undefined);
      }
    } catch {
      Alert.alert(t('stories.error_title'), t('stories.upload_error'));
    } finally {
      setUploadingStory(false);
    }
  }, [userId, composeAsset, accessToken, refreshStories, applyStories, t]);

  const handleOpenUserStories = useCallback(
    (targetUserId: number) => {
      const visible = storyGroups.filter(g => g.Stories.length > 0);
      const index = visible.findIndex(g =>
        isStoryGroupForUser(g, targetUserId),
      );
      if (index >= 0) {
        setViewerStartIndex(index);
        setViewerVisible(true);
        return;
      }
      if (!userId || Number(targetUserId) !== Number(userId)) {
        return;
      }
      void (async () => {
        const group = await getStoriesByUser(userId, userId);
        if (!group?.Stories.length) {
          return;
        }
        applyStories([
          group,
          ...storyGroups.filter(g => !isStoryGroupForUser(g, userId)),
        ]);
        setViewerStartIndex(0);
        setViewerVisible(true);
      })();
    },
    [storyGroups, userId, applyStories],
  );

  const handleOpenStoryProfile = useCallback(
    (targetUserId: number) => {
      setViewerVisible(false);
      if (userId && targetUserId === userId) {
        navigation.getParent()?.navigate('Profile' as never);
        return;
      }
      const group = storyGroups.find(g => g.User.UserId === targetUserId);
      if (group) {
        openFriendProfile(group.User, accessToken);
      }
      navigation.navigate('UserProfile', { userId: String(targetUserId) });
    },
    [navigation, userId, storyGroups, accessToken],
  );

  const handleDeleteStory = useCallback(
    (story: StoryItem) => {
      if (!userId) return;
      Alert.alert(t('stories.delete_title'), t('stories.delete_confirm'), [
        { text: t('profile.status_cancel'), style: 'cancel' },
        {
          text: t('stories.delete'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteStory(userId, story.Id, accessToken);
                applyStories(await refreshStories());
                setViewerVisible(false);
              } catch {
                Alert.alert(t('stories.error_title'), t('stories.delete_error'));
              }
            })();
          },
        },
      ]);
    },
    [userId, accessToken, refreshStories, applyStories, t],
  );

  const decoFaces = storyGroups
    .filter(g => g.User.UserId !== userId && g.User.ProfileImage)
    .slice(0, 3)
    .map(g => g.User.ProfileImage as string);

  if (!ready) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
        <HomeSkeleton />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <TabScreenScrollView
        bottomSpacing={40}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad },
        ]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              void handleAddStory();
            }}
            onLongPress={() => {
              void handlePickFromGallery();
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('stories.add')}>
            <FigmaIcon name="messageAdd" size={25} />
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => navigation.navigate('Notifications' as never)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('notifications.title')}>
              <FigmaIcon name="bell" size={25} />
              {unreadNotifications > 0 ? (
                <View
                  style={[
                    styles.notifDot,
                    { backgroundColor: theme.colors.plusCta },
                  ]}
                />
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Premium' as never)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('premium.title')}>
              <FigmaIcon name="crown" size={24} />
            </Pressable>
          </View>
        </View>

        {userId ? (
          <StoryRail
            ownUserId={userId}
            ownAvatarUri={avatarUri}
            ownName={fullName || firstName || '?'}
            groups={storyGroups}
            onAddStory={() => {
              void handleAddStory();
            }}
            onAddFromGallery={() => {
              void handlePickFromGallery();
            }}
            onOpenUser={handleOpenUserStories}
          />
        ) : null}

        {!isPremium ? (
          <Pressable
            onPress={() => navigation.navigate('Premium' as never)}
            style={({ pressed }) => [
              styles.heroCard,
              styles.plusCard,
              { borderColor: theme.colors.plusCta, opacity: pressed ? 0.94 : 1 },
            ]}>
            <LinearGradient
              colors={theme.gradients.plusCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cardCopy}>
              <Typography variant="title" weight="600" numberOfLines={2}>
                {t('home.hero_title')}
              </Typography>
              <Typography variant="caption" color="textMuted" numberOfLines={3}>
                {t('home.hero_subtitle')}
              </Typography>
              <FigmaButton
                label={t('home.hero_cta')}
                size="cta"
                trailing="arrow"
                style={styles.cardCta}
              />
            </View>
            <View
              style={[styles.plusArt, { width: plusArt, height: plusArt }]}
              pointerEvents="none">
              <Image
                source={images.crownHero}
                style={styles.plusCrown}
                resizeMode="contain"
              />
              <View style={[styles.plusStar, { top: '6%', left: '2%' }]}>
                <FigmaIcon name="star" size={starSize} />
              </View>
              <View style={[styles.plusStar, { top: '2%', right: '8%' }]}>
                <FigmaIcon name="star" size={starSize} />
              </View>
              <View style={[styles.plusStar, { bottom: '10%', right: '12%' }]}>
                <FigmaIcon name="star" size={starSize} />
              </View>
            </View>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => goToTab('Nearby')}
          style={({ pressed }) => [
            styles.heroCard,
            styles.nearbyCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.94 : 1,
            },
          ]}>
          <View style={styles.cardCopy}>
            <Typography variant="title" weight="600" numberOfLines={2}>
              {t('home.nearby_card_title')}
            </Typography>
            <Typography variant="caption" color="textMuted" numberOfLines={3}>
              {t('home.nearby_card_subtitle')}
            </Typography>
            <FigmaButton
              label={t('home.nearby_card_cta')}
              size="cta"
              trailing="arrow"
              style={styles.cardCta}
            />
          </View>
          <View
            style={[styles.radar, { width: radarArt, height: radarArt }]}
            pointerEvents="none">
            <View style={styles.radarCenter}>
              <FigmaIcon name="radarRing4" size={radarArt} />
            </View>
            <View style={styles.radarCenter}>
              <FigmaIcon name="radarRing3" size={Math.round(radarArt * 0.78)} />
            </View>
            <View style={styles.radarCenter}>
              <FigmaIcon name="radarRing2" size={Math.round(radarArt * 0.56)} />
            </View>
            <View style={styles.radarCenter}>
              <FigmaIcon name="radarRing1" size={Math.round(radarArt * 0.32)} />
            </View>
            <View style={styles.radarCenter}>
              <FigmaIcon name="nearbyPin" size={Math.round(radarArt * 0.18)} />
            </View>
            {decoFaces[0] ? (
              <Image
                source={{ uri: decoFaces[0] }}
                style={[
                  styles.radarFace,
                  {
                    width: Math.round(radarArt * 0.2),
                    height: Math.round(radarArt * 0.2),
                    borderRadius: Math.round(radarArt * 0.1),
                    borderColor: theme.colors.white,
                    top: '8%',
                    right: '6%',
                  },
                ]}
              />
            ) : null}
            {decoFaces[1] ? (
              <Image
                source={{ uri: decoFaces[1] }}
                style={[
                  styles.radarFace,
                  {
                    width: Math.round(radarArt * 0.2),
                    height: Math.round(radarArt * 0.2),
                    borderRadius: Math.round(radarArt * 0.1),
                    borderColor: theme.colors.white,
                    bottom: '12%',
                    right: '10%',
                  },
                ]}
              />
            ) : null}
            {decoFaces[2] ? (
              <Image
                source={{ uri: decoFaces[2] }}
                style={[
                  styles.radarFace,
                  {
                    width: Math.round(radarArt * 0.2),
                    height: Math.round(radarArt * 0.2),
                    borderRadius: Math.round(radarArt * 0.1),
                    borderColor: theme.colors.white,
                    top: '42%',
                    left: '4%',
                  },
                ]}
              />
            ) : null}
          </View>
        </Pressable>

        <View
          style={[
            styles.activityCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <Typography variant="bodyStrong">{t('home.activity_section')}</Typography>
          {recentActivity.length === 0 ? (
            <Typography variant="caption" color="textMuted">
              {t('home.activity_empty')}
            </Typography>
          ) : (
            recentActivity.map((item, i) => (
              <View key={item.id}>
                <HomeActivityRow item={item} onPress={openNotification} />
                {i < recentActivity.length - 1 ? (
                  <View
                    style={[styles.sep, { backgroundColor: theme.colors.border }]}
                  />
                ) : null}
              </View>
            ))
          )}
          {hasMoreActivity ? (
            <Pressable
              onPress={() => navigation.navigate('Notifications' as never)}
              hitSlop={8}
              accessibilityRole="button">
              <Typography variant="callout" weight="600" tint={theme.colors.plusCta}>
                {t('home.activity_see_all')}
              </Typography>
            </Pressable>
          ) : null}
        </View>
      </TabScreenScrollView>

      <StoryComposeOverlay
        visible={composeVisible}
        asset={composeAsset}
        uploading={uploadingStory}
        onClose={() => {
          if (uploadingStory) return;
          setComposeVisible(false);
          setComposeAsset(null);
        }}
        onSubmit={() => {
          void handleShareStory();
        }}
      />

      <StoryViewer
        visible={viewerVisible}
        groups={storyGroups}
        startGroupIndex={viewerStartIndex}
        viewerUserId={userId ?? 0}
        onClose={() => setViewerVisible(false)}
        onDelete={handleDeleteStory}
        onOpenProfile={handleOpenStoryProfile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  notifDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: 18,
    paddingLeft: 20,
    paddingRight: 8,
    gap: 8,
  },
  plusCard: {
    minHeight: 158,
  },
  nearbyCard: {
    minHeight: 168,
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    zIndex: 2,
  },
  cardCta: {
    marginTop: 8,
    maxWidth: '100%',
  },
  plusArt: {
    position: 'relative',
    flexShrink: 0,
  },
  plusCrown: {
    width: '100%',
    height: '100%',
  },
  plusStar: {
    position: 'absolute',
  },
  radar: {
    position: 'relative',
    flexShrink: 0,
  },
  radarCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarFace: {
    position: 'absolute',
    borderWidth: 1,
  },
  activityCard: {
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  sep: { height: StyleSheet.hairlineWidth, marginVertical: 10 },
});

export default HomeScreen;
