import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BottomActionDock,
  EmptyState,
  FigmaButton,
  Header,
  StoryAvatar,
  Typography,
  useScreenTopPad,
} from '../../components';
import {
  acceptFriendRequest,
  FriendshipRelation,
  getFriendshipStatus,
  getOrCreateDirectConversation,
  getStoriesByUser,
  sendFriendRequest,
  StoryUserGroup,
  unfriend,
  UserProfileInterest,
  UserProfileResponse,
  getBlockStatus,
  isBlockedByMe,
  unblockUser,
} from '../../api';
import { isAccountGoneError, useLocale, userFacingError } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { useChat } from '../../navigation/ChatContext';
import { useScreenBottomPad } from '../../navigation/tabBarLayout';
import { useLockTabSwipe } from '../../navigation/useLockTabSwipe';
import { useStorySeen } from '../../hooks/useStorySeen';
import { ProfilePhoto } from '../../services/photos/photoStore';
import { zodiacSymbolFromBirthDate } from '../../utils/zodiac';
import { useTheme } from '../../theme';
import {
  getCurrentCoordinates,
  peekLastCoordinates,
} from '../../services/location/currentPosition';
import { useHideTabBar } from '../../navigation/useHideTabBar';
import { prefetchMediaUris } from '../../services/photos/prefetchMedia';
import { afterUiSettled } from '../../utils/afterUiSettled';
import {
  CachedVisit,
  patchVisit,
  peekVisit,
  prefetchUserProfile,
  writeVisit,
} from '../../services/profile/visitCache';
import { StoryViewer } from '../home/StoryViewer';
import { TreatSheet } from '../treat/TreatSheet';
import { BlockSheet } from './BlockSheet';
import { PhotoViewerModal } from './PhotoViewerModal';
import { ProfilePhotoGrid } from './ProfilePhotoGrid';
import { ProfileSkeleton } from './ProfileSkeleton';

type UserProfileParams = { UserProfile: { userId: string; openTreat?: boolean } };
type Props = NativeStackScreenProps<UserProfileParams, 'UserProfile'>;

const AVATAR_SIZE = 86;

const INTEREST_EMOJI: Record<string, string> = {
  food: '🍽',
  dessert: '🍰',
  coffee: '☕',
  beverage: '🥤',
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatUsername(username: string) {
  const trimmed = username.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

function mapInterest(item: UserProfileInterest) {
  const code = (item.InterestTypeCode ?? '').toLowerCase();
  return {
    key: code || String(item.Id),
    label: item.InterestTypeName || item.InterestTypeCode || 'Interest',
    value: item.Value,
    emoji: INTEREST_EMOJI[code] ?? '✨',
  };
}

export function UserProfileScreen({ navigation, route }: Props) {
  useLockTabSwipe();
  const theme = useTheme();
  const { refreshInbox } = useChat();
  const { t } = useLocale();
  const topPad = useScreenTopPad();
  const screenBottomPad = useScreenBottomPad(20);
  const { userId: meId, accessToken } = useAuth();
  const { isGroupSeen } = useStorySeen(meId);
  const targetId = Number(route.params.userId);
  const seeded = Number.isFinite(targetId) ? peekVisit(targetId) : undefined;

  const [profile, setProfile] = useState<UserProfileResponse | null>(
    seeded?.profile ?? null,
  );
  const [photos, setPhotos] = useState<ProfilePhoto[]>(seeded?.photos ?? []);
  const [avatarUri, setAvatarUri] = useState<string | undefined>(
    seeded?.avatarUri,
  );
  const [loading, setLoading] = useState(!seeded);
  const [notFound, setNotFound] = useState(false);
  const [relation, setRelation] = useState<number>(
    seeded?.relation ?? FriendshipRelation.None,
  );
  const [friendshipId, setFriendshipId] = useState<number | null>(
    seeded?.friendshipId ?? null,
  );
  const [displayAge, setDisplayAge] = useState<number | null>(
    seeded?.displayAge ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState(seeded?.blockedByMe ?? false);
  const [stories, setStories] = useState<StoryUserGroup | null>(
    seeded?.stories ?? null,
  );
  const [storyOpen, setStoryOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const [treatOpen, setTreatOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  useHideTabBar(true);
  const loadedProfileIdRef = useRef<number | null>(seeded?.profile.Id ?? null);

  const applyVisit = useCallback((cached: CachedVisit) => {
    setProfile(cached.profile);
    setPhotos(cached.photos);
    setAvatarUri(cached.avatarUri);
    setRelation(cached.relation);
    setFriendshipId(cached.friendshipId);
    setDisplayAge(cached.displayAge);
    setBlockedByMe(cached.blockedByMe);
    setStories(cached.stories);
    loadedProfileIdRef.current = cached.profile.Id;
    setNotFound(false);
    setLoading(false);
  }, []);

  const load = useCallback(async () => {
    if (!Number.isFinite(targetId) || targetId <= 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const isSwitch = loadedProfileIdRef.current !== targetId;
    const cached = peekVisit(targetId);

    if (isSwitch) {
      if (cached) {
        applyVisit(cached);
      } else {
        setLoading(true);
        loadedProfileIdRef.current = null;
        setNotFound(false);
      }
    }

    try {
      const other = Boolean(meId && meId !== targetId);
      const cachedCoords = peekLastCoordinates();
      const extrasPromise = Promise.all([
        other
          ? getFriendshipStatus(meId!, targetId, accessToken)
          : Promise.resolve(null),
        other ? getBlockStatus(targetId).catch(() => null) : Promise.resolve(null),
        other
          ? getStoriesByUser(meId!, targetId, cachedCoords)
          : Promise.resolve(null),
      ]);
      const warmed =
        (await prefetchUserProfile(targetId, accessToken)) ??
        peekVisit(targetId);
      if (!Number(warmed?.profile.Id)) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const [statusRes, blockRes, storyGroup] = await extrasPromise;
      if (loadedProfileIdRef.current && loadedProfileIdRef.current !== warmed.profile.Id) {
        return;
      }

      const blocked = isBlockedByMe(blockRes);
      const nextVisit = {
        ...warmed,
        at: Date.now(),
        relation: statusRes?.Relation ?? warmed.relation,
        friendshipId: statusRes?.FriendshipId ?? warmed.friendshipId,
        blockedByMe: blocked,
        stories: storyGroup ?? warmed.stories,
      };
      applyVisit(nextVisit);
      writeVisit(warmed.profile.Id, nextVisit);
      void prefetchMediaUris(
        [
          warmed.avatarUri,
          ...warmed.photos.map(photo => photo.uri),
          storyGroup?.User.ProfileImage,
          ...(storyGroup?.Stories ?? [])
            .filter(s => s.MediaType === 'photo')
            .slice(0, 1)
            .map(s => s.MediaUrl),
        ],
        2000,
      );

      if (other && !storyGroup) {
        void getCurrentCoordinates(1500).then(fresh => {
          if (!fresh || loadedProfileIdRef.current !== targetId) return;
          return getStoriesByUser(meId!, targetId, fresh).then(next => {
            if (next && loadedProfileIdRef.current === targetId) {
              setStories(next);
              patchVisit(targetId, { stories: next });
            }
          });
        });
      }
    } catch (error) {
      if (cached) {
        applyVisit(cached);
      } else if (isAccountGoneError(error)) {
        setProfile(null);
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }, [targetId, meId, accessToken, applyVisit]);

  useFocusEffect(
    useCallback(() => {
      return afterUiSettled(() => {
        load();
      }, 50);
    }, [load]),
  );

  const name = useMemo(() => {
    if (!profile) return '';
    return `${profile.FirstName} ${profile.LastName}`.trim() || profile.Username;
  }, [profile]);

  const zodiacSymbol = useMemo(
    () => zodiacSymbolFromBirthDate(profile?.BirthDate),
    [profile?.BirthDate],
  );

  const nameWithAgeAndZodiac = useMemo(() => {
    if (!name) return '';
    const parts: string[] = [name];
    if (displayAge != null) {
      parts.push(String(displayAge));
    }
    let line = parts.join(', ');
    if (zodiacSymbol) {
      line = `${line} ${zodiacSymbol}`;
    }
    return line;
  }, [name, displayAge, zodiacSymbol]);

  const statusText = useMemo(() => {
    const text = (
      profile?.StatusText ??
      profile?.statusText ??
      ''
    ).trim();
    if (!text) return '';
    const expiresAt = profile?.StatusExpiresAt ?? profile?.statusExpiresAt;
    if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) return '';
    return text;
  }, [profile?.StatusText, profile?.statusText, profile?.StatusExpiresAt, profile?.statusExpiresAt]);

  const interests = useMemo(
    () => (profile?.Interests ?? []).map(mapInterest),
    [profile],
  );

  const hasStory = (stories?.Stories.length ?? 0) > 0;
  const storySeen = hasStory && isGroupSeen(stories);
  const viewerPhotos = useMemo(() => {
    const list = [...photos];
    if (avatarUri && !list.some(photo => photo.uri === avatarUri)) {
      list.unshift({ id: 'avatar', uri: avatarUri, sortOrder: -1 });
    }
    return list;
  }, [photos, avatarUri]);

  const onAvatarPress = () => {
    if (hasStory) {
      setStoryOpen(true);
      return;
    }
    if (viewerPhotos.length > 0) {
      setPhotoIndex(0);
    }
  };

  const friendLabel = (() => {
    if (relation === FriendshipRelation.Friends) return t('user_profile.friends');
    if (relation === FriendshipRelation.PendingOutgoing) {
      return t('user_profile.request_sent');
    }
    if (relation === FriendshipRelation.PendingIncoming) {
      return t('user_profile.accept_request');
    }
    return t('user_profile.add_friend');
  })();

  const onFriendAction = async () => {
    if (!profile || busy) return;
    if (!meId) return;
    setBusy(true);
    try {
      if (relation === FriendshipRelation.PendingIncoming && friendshipId) {
        await acceptFriendRequest(meId, friendshipId, accessToken);
        setRelation(FriendshipRelation.Friends);
      } else if (
        relation === FriendshipRelation.None ||
        relation === FriendshipRelation.Rejected ||
        relation === FriendshipRelation.Cancelled
      ) {
        const res = await sendFriendRequest(meId, targetId, accessToken);
        setRelation(FriendshipRelation.PendingOutgoing);
        setFriendshipId(res.Id);
      }
    } catch (error) {
      Alert.alert(
        t('user_profile.title'),
        userFacingError(error, t, 'user_profile.action_error'),
      );
    } finally {
      setBusy(false);
    }
  };

  const onUnfriend = () => {
    if (
      !profile ||
      busy ||
      meId === targetId ||
      relation !== FriendshipRelation.Friends
    ) {
      return;
    }
    Alert.alert(
      t('user_profile.unfriend_title'),
      t('user_profile.unfriend_confirm'),
      [
        { text: t('profile.status_cancel'), style: 'cancel' },
        {
          text: t('user_profile.unfriend'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              if (!meId) return;
              setBusy(true);
              try {
                await unfriend(meId, targetId, accessToken);
                setRelation(FriendshipRelation.None);
                setFriendshipId(null);
              } catch (error) {
                Alert.alert(
                  t('user_profile.unfriend'),
                  userFacingError(error, t, 'user_profile.action_error'),
                );
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ],
    );
  };

  const onMessagePress = async () => {
    if (!meId || busy || meId === targetId) return;
    if (blockedByMe) {
      Alert.alert(
        t('user_profile.message'),
        t('safety.users_blocked'),
      );
      return;
    }

    setBusy(true);
    try {
      const res = await getOrCreateDirectConversation(
        meId,
        targetId,
        accessToken,
      );
      if (!res.conversationId) {
        throw new Error(t('user_profile.action_error'));
      }
      await refreshInbox();
      const params = { conversationId: String(res.conversationId) };
      // Bubble to AppStack overlay above tabs when available.
      const root = navigation.getParent() ?? navigation;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (root as any).navigate('ChatThread', params);
    } catch (error) {
      Alert.alert(
        t('user_profile.message'),
        userFacingError(error, t, 'user_profile.action_error'),
      );
    } finally {
      setBusy(false);
    }
  };

  const onBlocked = () => {
    setBlockOpen(false);
    setBlockedByMe(true);
    setRelation(FriendshipRelation.None);
    setFriendshipId(null);
    setStories(null);
  };

  const onUnblock = () => {
    void (async () => {
      setBusy(true);
      try {
        await unblockUser(targetId);
        setBlockedByMe(false);
      } catch (error) {
        Alert.alert(
          t('safety.unblock'),
          userFacingError(error, t, 'safety.unblock_error'),
        );
      } finally {
        setBusy(false);
      }
    })();
  };

  const openBlock = () => {
    setBlockOpen(true);
  };

  const openSafetyMenu = () => {
    afterUiSettled(() => {
      Alert.alert(name || t('user_profile.title'), undefined, [
        ...(relation === FriendshipRelation.Friends && !blockedByMe
          ? [{ text: t('user_profile.unfriend'), onPress: onUnfriend }]
          : []),
        {
          text: blockedByMe ? t('safety.unblock') : t('safety.block'),
          style: 'destructive' as const,
          onPress: blockedByMe ? onUnblock : openBlock,
        },
        { text: t('settings.cancel'), style: 'cancel' as const },
      ]);
    });
  };

  const openTreat = () => {
    setTreatOpen(true);
  };

  const openTreatRequested = route.params.openTreat === true;
  React.useEffect(() => {
    if (openTreatRequested && profile && !blockedByMe && meId !== targetId) {
      setTreatOpen(true);
      navigation.setParams({ openTreat: undefined });
    }
  }, [openTreatRequested, profile, blockedByMe, meId, targetId, navigation]);

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.getParent()?.goBack();
  };

  if (loading) {
    return (
      <View
        style={[
          styles.viewport,
          { backgroundColor: theme.colors.background, paddingTop: topPad },
        ]}>
        <StatusBar
          barStyle={theme.isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <Header
          title={t('user_profile.title')}
          onBack={goBack}
          backAccessibilityLabel={t('common.back')}
        />
        <ProfileSkeleton variant="visit" />
      </View>
    );
  }

  if (notFound || !profile) {
    return (
      <View
        style={[
          styles.viewport,
          {
            backgroundColor: theme.colors.background,
            paddingTop: topPad,
            paddingBottom: screenBottomPad,
          },
        ]}>
        <StatusBar
          barStyle={theme.isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <Header
          title={t('user_profile.title')}
          onBack={goBack}
          backAccessibilityLabel={t('common.back')}
        />
        <EmptyState
          fill
          figmaIcon="tabProfile"
          title={t('user_profile.not_found_title')}
          description={t('user_profile.not_found_desc')}
        />
      </View>
    );
  }

  const hasBio = (profile.Bio ?? '').trim().length > 0;
  const isSelf = meId === targetId;
  const areFriends = relation === FriendshipRelation.Friends;
  const scrollBottomPad = isSelf ? screenBottomPad : 24;

  return (
    <View
      style={[
        styles.viewport,
        { backgroundColor: theme.colors.background, paddingTop: topPad },
      ]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <View style={styles.flex}>
        <Header
          title={
            isSelf ? t('user_profile.preview_title') : t('user_profile.title')
          }
          onBack={goBack}
          backAccessibilityLabel={t('common.back')}
          actions={
            !isSelf
              ? [
                  {
                    icon: 'more',
                    onPress: openSafetyMenu,
                    accessibilityLabel: t('safety.more'),
                  },
                ]
              : []
          }
        />

        <ScrollView
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: scrollBottomPad },
          ]}>
          {isSelf ? (
            <View
              style={[
                styles.previewBanner,
                {
                  backgroundColor: theme.colors.plusSoft,
                  borderColor: theme.colors.border,
                },
              ]}>
              <Typography variant="callout" weight="600">
                {t('user_profile.preview_banner')}
              </Typography>
            </View>
          ) : null}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Pressable
                style={styles.avatarRing}
                onPress={onAvatarPress}
                disabled={!hasStory && viewerPhotos.length === 0}
                accessibilityRole="button"
                accessibilityLabel={
                  hasStory ? t('stories.view') : t('profile.view_avatar')
                }>
                <StoryAvatar
                  uri={avatarUri}
                  size={AVATAR_SIZE}
                  hasStory={hasStory}
                  seen={storySeen}
                  fallback={initialsFromName(name)}
                />
              </Pressable>

              <View style={styles.nameBlock}>
                <Typography variant="title" numberOfLines={1}>
                  {nameWithAgeAndZodiac}
                </Typography>
                <Typography variant="callout" color="textMuted" numberOfLines={1}>
                  {formatUsername(profile.Username)}
                </Typography>
                {statusText ? (
                  <View
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor: theme.colors.surfaceAlt,
                        borderColor: theme.colors.border,
                      },
                    ]}>
                    <Typography variant="caption" weight="600" numberOfLines={2}>
                      {statusText}
                    </Typography>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.body}>
            {interests.length > 0 ? (
              <View style={styles.favGrid}>
                {interests.map(item => (
                  <View
                    key={item.key}
                    style={[
                      styles.favCard,
                      { backgroundColor: theme.colors.surfaceAlt },
                    ]}>
                    <View
                      style={[
                        styles.favIcon,
                        { backgroundColor: theme.colors.plusSoft },
                      ]}>
                      <Text style={styles.favEmoji}>{item.emoji}</Text>
                    </View>
                    <View style={styles.favCopy}>
                      <Typography variant="caption" color="textMuted" numberOfLines={1}>
                        {item.label}
                      </Typography>
                      <Typography variant="callout" weight="600" numberOfLines={1}>
                        {item.value}
                      </Typography>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Typography variant="callout" color="textMuted">
                {t('profile.interests_empty')}
              </Typography>
            )}

            <View style={styles.about}>
              <Typography variant="title">{t('edit.about')}</Typography>
              <Typography
                variant="callout"
                color={hasBio ? 'text' : 'textMuted'}
                style={styles.aboutBody}>
                {hasBio ? profile.Bio : t('user_profile.bio_empty')}
              </Typography>
            </View>

            {photos.length > 0 ? (
              <ProfilePhotoGrid photos={photos} editable={false} />
            ) : null}
          </View>
        </ScrollView>

        {!isSelf ? (
          <BottomActionDock>
            {blockedByMe ? (
              <FigmaButton
                label={t('safety.unblock')}
                tone="ghost"
                size="md"
                fullWidth
                disabled={busy}
                onPress={onUnblock}
              />
            ) : areFriends ? (
              <>
                <FigmaButton
                  label={t('user_profile.message')}
                  size="md"
                  disabled={busy}
                  onPress={onMessagePress}
                  style={styles.dockBtn}
                />
                <FigmaButton
                  label={t('treat.cta')}
                  tone="soft"
                  size="md"
                  disabled={busy}
                  onPress={openTreat}
                  style={styles.dockBtn}
                />
              </>
            ) : (
              <>
                <FigmaButton
                  label={friendLabel}
                  size="md"
                  tone={
                    relation === FriendshipRelation.PendingOutgoing
                      ? 'soft'
                      : 'solid'
                  }
                  disabled={
                    busy ||
                    isSelf ||
                    relation === FriendshipRelation.PendingOutgoing
                  }
                  onPress={onFriendAction}
                  style={styles.dockBtn}
                />
                <FigmaButton
                  label={t('treat.cta')}
                  tone="soft"
                  size="md"
                  disabled={busy}
                  onPress={openTreat}
                  style={styles.dockBtn}
                />
              </>
            )}
          </BottomActionDock>
        ) : null}
      </View>

      {!isSelf ? (
        <>
          <TreatSheet
            visible={treatOpen}
            receiverUserId={targetId}
            receiverName={name}
            favorites={(profile.Interests ?? []).filter(i => (i.Value ?? '').trim().length > 0)}
            onClose={() => setTreatOpen(false)}
            onSent={treat => {
              setTreatOpen(false);
              const root = navigation.getParent() ?? navigation;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (root as any).navigate('TreatResult', { treatId: treat.id });
            }}
          />
          <BlockSheet
            visible={blockOpen}
            targetUserId={targetId}
            targetName={name}
            onClose={() => setBlockOpen(false)}
            onBlocked={onBlocked}
          />
        </>
      ) : null}

      {stories ? (
        <StoryViewer
          visible={storyOpen}
          groups={[stories]}
          startGroupIndex={0}
          viewerUserId={meId ?? 0}
          onClose={() => setStoryOpen(false)}
          onDelete={() => undefined}
          onOpenProfile={() => setStoryOpen(false)}
        />
      ) : null}

      {photoIndex != null && viewerPhotos.length > 0 ? (
        <PhotoViewerModal
          photos={viewerPhotos}
          index={photoIndex}
          onClose={() => setPhotoIndex(null)}
          onIndexChange={setPhotoIndex}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /** Fills the navigator scene and clips overflow so the dock cannot be pushed off-screen. */
  viewport: {
    flex: 1,
    overflow: 'hidden',
  },
  flex: { flex: 1, minHeight: 0 },
  scrollContent: { paddingBottom: 20 },
  previewBanner: {
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
    overflow: 'visible',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
    overflow: 'visible',
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    overflow: 'hidden',
    borderRadius: AVATAR_SIZE / 2,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  nameBlock: { flex: 1, gap: 2, paddingRight: 8, minWidth: 0 },
  body: { paddingHorizontal: 16, paddingTop: 8, gap: 20 },
  favGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  favCard: {
    width: '48.5%',
    flexGrow: 1,
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favEmoji: { fontSize: 16 },
  favCopy: { flex: 1, minWidth: 0, gap: 0 },
  about: { gap: 10, minHeight: 94 },
  aboutBody: { lineHeight: 22 },
  dockBtn: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
});

export default UserProfileScreen;
