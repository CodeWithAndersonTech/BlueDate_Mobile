import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { images } from '../../assets';
import {
  Avatar,
  Icon,
  IconButton,
  StatusEditModal,
  TabScreenScrollView,
  Typography,
} from '../../components';
import {
  createStory,
  deleteStory,
  getStoryFeed,
  getUserProfile,
  resolveMediaUrl,
  resolveStoryMediaUrls,
  StoryItem,
  StoryUserGroup,
  updateUserStatus,
} from '../../api';
import { useLocale, userFacingError } from '../../i18n';
import { usePremium } from '../../hooks/usePremium';
import { useAuth } from '../../navigation/AuthContext';
import { useNotifications } from '../../navigation/NotificationsContext';
import { useHideTabBar } from '../../navigation/useHideTabBar';
import { HomeStackParamList } from '../../navigation/types';
import { loadProfilePhotos } from '../../services/photos/photoStore';
import {
  pickStoryMediaFromCamera,
  pickStoryMediaFromLibrary,
  type PickedStoryAsset,
  type StoryPickResult,
} from '../../services/stories/pickStoryMedia';
import { getCurrentCoordinates } from '../../services/location/currentPosition';
import { useTheme } from '../../theme';
import { NotificationRow } from '../notifications/NotificationRow';
import { useOpenNotification } from '../notifications/notificationMeta';
import { StoryComposeOverlay } from './StoryComposeOverlay';
import { StoryRail } from './StoryRail';
import { StoryViewer } from './StoryViewer';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeFeed'>;

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { userId, accessToken } = useAuth();
  const {
    items: notifications,
    unreadCount: unreadNotifications,
    refresh: refreshNotifications,
  } = useNotifications();
  const openNotification = useOpenNotification();
  const recentActivity = notifications
    .filter(n => n.type !== 'like' && n.type !== 'match')
    .slice(0, 5);
  const { isPremium, refresh: refreshPremium } = usePremium();
  const [firstName, setFirstName] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const [statusText, setStatusText] = useState('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [storyGroups, setStoryGroups] = useState<StoryUserGroup[]>([]);
  const [composeAsset, setComposeAsset] = useState<PickedStoryAsset | null>(
    null,
  );
  const [composeVisible, setComposeVisible] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  useHideTabBar(composeVisible || viewerVisible);
  const goToTab = useCallback(
    (tab: string) => navigation.getParent()?.navigate(tab as never),
    [navigation],
  );
  const lastHomeFetchAt = useRef(0);

  const refreshStories = useCallback(async () => {
    if (!userId) return;
    try {
      const feed = await getStoryFeed(userId, accessToken);
      const resolved = await resolveStoryMediaUrls(feed.Items);
      setStoryGroups(resolved);
    } catch {
      /* keep previous stories */
    }
  }, [userId, accessToken]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let cancelled = false;
      void refreshNotifications();
      const fresh =
        lastHomeFetchAt.current > 0 &&
        Date.now() - lastHomeFetchAt.current < 25_000;
      if (fresh) {
        return undefined;
      }
      lastHomeFetchAt.current = Date.now();
      void refreshPremium();
      void refreshStories();

      (async () => {
        try {
          const [profile, photoBundle] = await Promise.all([
            getUserProfile(userId, accessToken),
            loadProfilePhotos(userId, accessToken).catch(() => ({
              gallery: [],
              avatarUri: undefined as string | undefined,
            })),
          ]);
          if (cancelled) return;

          const name = `${profile.FirstName} ${profile.LastName}`.trim();
          setFirstName(profile.FirstName?.trim() || profile.Username || '');
          setFullName(name || profile.Username || '');

          const profileAvatar = await resolveMediaUrl(profile.ProfileImage);
          setAvatarUri(photoBundle.avatarUri ?? profileAvatar);

          const nextStatus = (profile.StatusText ?? '').trim();
          const expiresAt = profile.StatusExpiresAt;
          const expired =
            !!expiresAt && new Date(expiresAt).getTime() <= Date.now();
          setStatusText(expired ? '' : nextStatus);
        } catch {
          /* keep last known greeting */
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [userId, accessToken, refreshNotifications, refreshPremium, refreshStories]),
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

  const saveStatus = useCallback(
    async (next: string) => {
      if (!userId) return;
      setStatusSaving(true);
      try {
        const res = await updateUserStatus(
          { UserId: userId, StatusText: next },
          accessToken,
        );
        const saved = (res.StatusText ?? '').trim();
        const expiresAt = res.StatusExpiresAt;
        const expired =
          !!expiresAt && new Date(expiresAt).getTime() <= Date.now();
        setStatusText(expired ? '' : saved);
        setStatusModalOpen(false);
      } catch (error) {
        Alert.alert(
          t('profile.status_title'),
          userFacingError(error, t, 'profile.status_error'),
        );
      } finally {
        setStatusSaving(false);
      }
    },
    [userId, accessToken, t],
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
      await createStory(userId, composeAsset, undefined, accessToken, coords);
      setComposeVisible(false);
      setComposeAsset(null);
      await refreshStories();
    } catch {
      Alert.alert(t('stories.error_title'), t('stories.upload_error'));
    } finally {
      setUploadingStory(false);
    }
  }, [userId, composeAsset, accessToken, refreshStories, t]);

  const handleOpenUserStories = useCallback(
    (targetUserId: number) => {
      const index = storyGroups.findIndex(g => g.User.UserId === targetUserId);
      if (index < 0) return;
      setViewerStartIndex(index);
      setViewerVisible(true);
    },
    [storyGroups],
  );

  const handleOpenStoryProfile = useCallback(
    (targetUserId: number) => {
      setViewerVisible(false);
      if (userId && targetUserId === userId) {
        navigation.getParent()?.navigate('Profile' as never);
        return;
      }
      navigation.navigate('UserProfile', { userId: String(targetUserId) });
    },
    [navigation, userId],
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
                await refreshStories();
                setViewerVisible(false);
              } catch {
                Alert.alert(t('stories.error_title'), t('stories.delete_error'));
              }
            })();
          },
        },
      ]);
    },
    [userId, accessToken, refreshStories, t],
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <TabScreenScrollView
        bottomSpacing={28}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8 },
        ]}>
        <View style={styles.header}>
          <View style={styles.greeting}>
            <View style={styles.avatarWrap}>
              <Pressable
                onPress={() => goToTab('Profile')}
                accessibilityRole="button"
                accessibilityLabel={t('home.greeting')}>
                <Avatar
                  uri={avatarUri}
                  name={fullName || firstName || '?'}
                  size="md"
                  premium={isPremium}
                  online
                />
              </Pressable>
              <Pressable
                onPress={() => setStatusModalOpen(true)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={t('profile.status_title')}
                style={[
                  styles.statusBubble,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                  theme.shadows.sm,
                ]}>
                <Text
                  style={[
                    styles.statusBubbleText,
                    { color: theme.colors.text },
                  ]}
                  numberOfLines={1}>
                  {statusText || '+'}
                </Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.greetingText}
              onPress={() => goToTab('Profile')}>
              <Typography variant="caption" color="textMuted">
                {t('home.greeting')}
              </Typography>
              <Typography variant="h3">{firstName || '…'}</Typography>
            </Pressable>
          </View>
          <View style={styles.headerActions}>
            <IconButton
              name="bell"
              badge={unreadNotifications}
              onPress={() =>
                // Bubbles to AppStack above tabs — full-screen, no tab bar.
                navigation.navigate('Notifications' as never)
              }
              accessibilityLabel={t('notifications.title')}
            />
            <IconButton
              name="crown"
              onPress={() => navigation.navigate('Premium' as never)}
              accessibilityLabel={t('premium.title')}
            />
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
              styles.premiumCard,
              {
                opacity: pressed ? 0.94 : 1,
                transform: [{ scale: pressed ? 0.985 : 1 }],
              },
              theme.shadows.sm,
            ]}>
            <LinearGradient
              colors={theme.gradients.premium}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.premiumContent}>
              <View style={styles.premiumTextCol}>
                <View style={styles.premiumBadge}>
                  <Icon name="crown" size={12} color={theme.colors.onPremium} filled />
                  <Typography variant="overline" tint={theme.colors.onPremium}>
                    {t('home.hero_badge')}
                  </Typography>
                </View>
                <Typography variant="title" tint={theme.colors.onPremium} numberOfLines={2}>
                  {t('home.hero_title').replace(/\n/g, ' ')}
                </Typography>
                <Typography
                  variant="caption"
                  tint="rgba(44,33,0,0.72)"
                  numberOfLines={2}>
                  {t('home.hero_subtitle')}
                </Typography>
              </View>
              <View style={styles.premiumCta}>
                <Typography variant="caption" tint={theme.colors.onPremium}>
                  {t('home.hero_cta')}
                </Typography>
                <Icon name="chevron-right" size={14} color={theme.colors.onPremium} />
              </View>
            </View>
          </Pressable>
        ) : null}

        {/* Nearby — same size card, Meerk logo + copy */}
        <Pressable
          onPress={() => goToTab('Nearby')}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderWidth: StyleSheet.hairlineWidth,
              opacity: pressed ? 0.94 : 1,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            },
            theme.shadows.md,
          ]}>
          <View style={styles.cardContent}>
            <View
              style={[
                styles.logoWrap,
                { backgroundColor: theme.colors.primarySoft },
              ]}>
              <Image
                source={images.appLogo}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Typography variant="h2" style={styles.cardTitle}>
              {t('home.nearby_card_title')}
            </Typography>
            <Typography variant="callout" color="textMuted">
              {t('home.nearby_card_subtitle')}
            </Typography>
            <View
              style={[
                styles.nearbyCta,
                { backgroundColor: theme.colors.primary },
              ]}>
              <Typography variant="bodyStrong" tint={theme.colors.onPrimary}>
                {t('home.nearby_card_cta')}
              </Typography>
              <Icon
                name="chevron-right"
                size={16}
                color={theme.colors.onPrimary}
              />
            </View>
          </View>
        </Pressable>

        <View style={styles.section}>
          <Typography variant="title">{t('home.activity_section')}</Typography>
          {recentActivity.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                styles.activityEmptyCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}>
              <View
                style={[
                  styles.activityEmptyIcon,
                  { backgroundColor: theme.colors.primarySoft },
                ]}>
                <Icon name="bell" size={22} color={theme.colors.primary} />
              </View>
              <Typography variant="bodyStrong" align="center">
                {t('home.activity_empty')}
              </Typography>
            </View>
          ) : (
            <View
              style={[
                styles.activityCard,
                { backgroundColor: theme.colors.card },
                theme.shadows.sm,
              ]}>
              {recentActivity.map((item, i) => (
                <View key={item.id}>
                  <NotificationRow item={item} onPress={openNotification} compact />
                  {i < recentActivity.length - 1 && (
                    <View
                      style={[
                        styles.sep,
                        { backgroundColor: theme.colors.border },
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>
          )}
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

      <StatusEditModal
        visible={statusModalOpen}
        initialStatus={statusText}
        saving={statusSaving}
        onClose={() => setStatusModalOpen(false)}
        onSave={value => {
          void saveStatus(value);
        }}
        onClear={() => {
          void saveStatus('');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  greeting: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
    marginRight: 8,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    overflow: 'visible',
    zIndex: 5,
  },
  statusBubble: {
    position: 'absolute',
    top: -10,
    left: -8,
    maxWidth: 88,
    minWidth: 28,
    minHeight: 26,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 20,
    elevation: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBubbleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  greetingText: { flex: 1, gap: 2, minWidth: 0 },
  headerActions: { flexDirection: 'row', gap: 8, flexShrink: 0 },
  premiumCard: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  premiumTextCol: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  premiumBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(44,33,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  premiumCta: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(44,33,0,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 200,
  },
  cardContent: {
    padding: 24,
    gap: 10,
    minHeight: 200,
    justifyContent: 'center',
  },
  cardTitle: { marginTop: 2 },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 36, height: 36 },
  nearbyCta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  section: { gap: 14, marginTop: 8 },
  emptyCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  activityEmptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 22,
    paddingHorizontal: 16,
    minHeight: 120,
  },
  activityEmptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCard: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
});

export default HomeScreen;
