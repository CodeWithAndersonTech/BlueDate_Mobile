import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, Header } from '../../components';
import {
  acceptFriendRequest,
  FriendshipRelation,
  friendshipItems,
  getFriends,
  getFriendshipStatus,
  getLikeCount,
  getLikeStatus,
  getOrCreateDirectConversation,
  getUserProfile,
  likeCountFromResponse,
  likeUser,
  resolveMediaUrl,
  sendFriendRequest,
  unfriend,
  unlikeUser,
  UserProfileInterest,
  UserProfileResponse,
} from '../../api';
import { useLocale } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { useChat } from '../../navigation/ChatContext';
import {
  DOCK_ACTION_HEIGHT,
  DOCK_PAD_TOP,
  useScreenBottomPad,
  useStickyDockLayout,
} from '../../navigation/tabBarLayout';
import { useLockTabSwipe } from '../../navigation/useLockTabSwipe';
import {
  loadProfilePhotos,
  ProfilePhoto,
} from '../../services/photos/photoStore';
import { useTheme } from '../../theme';
import {
  getMockUserProfile,
  isMockProfileUserId,
} from '../../utils/mockData';
import { ProfilePhotoGrid } from './ProfilePhotoGrid';

type UserProfileParams = { UserProfile: { userId: string } };
type Props = NativeStackScreenProps<UserProfileParams, 'UserProfile'>;

const AVATAR_SIZE = 86;
const TILE_WIDTH = '48%';
const TILE_HEIGHT = 100;

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
  const screenBottomPad = useScreenBottomPad(20);
  // Friend profile sits inside Material Top Tabs — keep CTAs above the pill
  // even when the tab bar hide heuristic flickers.
  const dock = useStickyDockLayout(DOCK_ACTION_HEIGHT, {
    forceAboveTabBar: true,
  });
  const { userId: meId, accessToken } = useAuth();
  const targetId = Number(route.params.userId);

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [relation, setRelation] = useState<number>(FriendshipRelation.None);
  const [friendshipId, setFriendshipId] = useState<number | null>(null);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [displayAge, setDisplayAge] = useState<number | null>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const loadedProfileIdRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(targetId) || targetId <= 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // Keep previous content mounted while refreshing the same profile —
    // full-screen spinner caused a visible blink when opening from Nearby.
    if (loadedProfileIdRef.current !== targetId) {
      setLoading(true);
      loadedProfileIdRef.current = null;
    }
    setNotFound(false);

    // Incoming / Sent mock rows — render a full local profile preview.
    if (isMockProfileUserId(targetId)) {
      const mock = getMockUserProfile(targetId);
      if (!mock) {
        setProfile(null);
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile({
        IsSuccess: true,
        Id: mock.userId,
        FirstName: mock.firstName,
        LastName: mock.lastName,
        Username: mock.username,
        Email: '',
        Bio: mock.bio,
        ProfileImage: mock.profileImage ?? null,
        Age: mock.age ?? null,
        IsEmailVerified: true,
        IsVerified: mock.isVerified,
        Interests: mock.interests.map(item => ({
          Id: item.id,
          Value: item.value,
          InterestTypeCode: item.code,
          InterestTypeName: item.name,
        })),
      });
      setPhotos(
        mock.photoUris.map((uri, index) => ({
          id: `mock-photo-${mock.userId}-${index}`,
          uri,
          sortOrder: index,
        })),
      );
      setAvatarUri(mock.profileImage ?? mock.photoUris[0]);
      setRelation(mock.relation);
      setFriendshipId(mock.friendshipId);
      setHasLiked(false);
      setLikeCount(mock.likeCount);
      setDisplayAge(mock.age ?? null);
      setFriendCount(mock.relation === 3 ? 36 : 12);
      loadedProfileIdRef.current = mock.userId;
      setLoading(false);
      return;
    }

    try {
      const [profileRes, photoBundle, friendsRes, likeCountRes] =
        await Promise.all([
          getUserProfile(targetId, accessToken),
          loadProfilePhotos(targetId, accessToken).catch(() => ({
            gallery: [] as ProfilePhoto[],
            avatarUri: undefined as string | undefined,
          })),
          getFriends(targetId, accessToken).catch(() => ({ Items: [] })),
          getLikeCount(targetId, accessToken).catch(() => ({ Count: 0 })),
        ]);
      setProfile(profileRes);
      loadedProfileIdRef.current = profileRes.Id;
      setPhotos(photoBundle.gallery);
      setDisplayAge(
        typeof profileRes.Age === 'number' ? profileRes.Age : null,
      );
      setFriendCount(friendshipItems(friendsRes).length);
      setLikeCount(likeCountFromResponse(likeCountRes));
      const profileAvatar = await resolveMediaUrl(profileRes.ProfileImage);
      setAvatarUri(photoBundle.avatarUri ?? profileAvatar);

      if (meId && meId !== targetId) {
        const [statusRes, likeStatusRes] = await Promise.all([
          getFriendshipStatus(meId, targetId, accessToken),
          getLikeStatus(meId, targetId, accessToken),
        ]);
        setRelation(statusRes.Relation);
        setFriendshipId(statusRes.FriendshipId);
        setHasLiked(
          !!(likeStatusRes.HasLiked ??
            (likeStatusRes as { hasLiked?: boolean }).hasLiked),
        );
      }
    } catch {
      setProfile(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [targetId, meId, accessToken]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const name = useMemo(() => {
    if (!profile) return '';
    return `${profile.FirstName} ${profile.LastName}`.trim() || profile.Username;
  }, [profile]);

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
    // Mock profiles: update local UI only.
    if (isMockProfileUserId(targetId)) {
      if (relation === FriendshipRelation.PendingIncoming) {
        setRelation(FriendshipRelation.Friends);
      } else if (
        relation === FriendshipRelation.None ||
        relation === FriendshipRelation.Rejected ||
        relation === FriendshipRelation.Cancelled
      ) {
        setRelation(FriendshipRelation.PendingOutgoing);
        setFriendshipId(-(targetId));
      }
      return;
    }

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
        error instanceof Error ? error.message : t('user_profile.action_error'),
      );
    } finally {
      setBusy(false);
    }
  };

  const onToggleLike = async () => {
    if (!profile || likeBusy || (meId != null && meId === targetId)) return;

    if (isMockProfileUserId(targetId)) {
      setHasLiked(prev => !prev);
      setLikeCount(c => (hasLiked ? Math.max(0, c - 1) : c + 1));
      return;
    }

    if (!meId) return;
    const prevLiked = hasLiked;
    const prevCount = likeCount;
    setLikeBusy(true);
    setHasLiked(!prevLiked);
    setLikeCount(c => (prevLiked ? Math.max(0, c - 1) : c + 1));
    try {
      if (prevLiked) {
        await unlikeUser(meId, targetId, accessToken);
      } else {
        await likeUser(meId, targetId, accessToken);
      }
      const fresh = await getLikeCount(targetId, accessToken).catch(() => null);
      if (fresh) {
        setLikeCount(likeCountFromResponse(fresh));
      }
    } catch (error) {
      setHasLiked(prevLiked);
      setLikeCount(prevCount);
      Alert.alert(
        t('user_profile.like'),
        error instanceof Error ? error.message : t('user_profile.action_error'),
      );
    } finally {
      setLikeBusy(false);
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
              if (isMockProfileUserId(targetId)) {
                setRelation(FriendshipRelation.None);
                setFriendshipId(null);
                setHasLiked(false);
                return;
              }
              if (!meId) return;
              setBusy(true);
              try {
                await unfriend(meId, targetId, accessToken);
                setRelation(FriendshipRelation.None);
                setFriendshipId(null);
                setHasLiked(false);
              } catch (error) {
                Alert.alert(
                  t('user_profile.unfriend'),
                  error instanceof Error
                    ? error.message
                    : t('user_profile.action_error'),
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
    if (relation !== FriendshipRelation.Friends) {
      Alert.alert(
        t('user_profile.message'),
        t('user_profile.message_friends_only'),
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
        error instanceof Error ? error.message : t('user_profile.action_error'),
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.viewport, { backgroundColor: theme.colors.background }]}>
        <Header title={t('user_profile.title')} />
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (notFound || !profile) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.viewport, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          barStyle={theme.isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <Header title={t('user_profile.title')} />
        <EmptyState
          fill
          icon="user"
          title={t('user_profile.not_found_title')}
          description={t('user_profile.not_found_desc')}
        />
      </SafeAreaView>
    );
  }

  const hasBio = (profile.Bio ?? '').trim().length > 0;
  const isSelf = meId === targetId;
  const areFriends = relation === FriendshipRelation.Friends;
  const scrollBottomPad = isSelf ? screenBottomPad : dock.scrollClearance;

  return (
    <View
      style={[
        styles.viewport,
        { backgroundColor: theme.colors.background },
      ]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <SafeAreaView edges={['top']} style={styles.flex}>
        <Header
          title={t('user_profile.title')}
          actions={
            !isSelf && areFriends
              ? [
                  {
                    icon: 'heart',
                    onPress: () => {
                      void onToggleLike();
                    },
                    accessibilityLabel: hasLiked
                      ? t('user_profile.liked')
                      : t('user_profile.like'),
                    color: hasLiked ? theme.colors.danger : undefined,
                    filled: hasLiked,
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
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.avatarRing}>
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={[styles.avatar, { borderColor: theme.colors.border }]}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      styles.avatarFallback,
                      {
                        backgroundColor: theme.colors.primarySoft,
                        borderColor: theme.colors.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.avatarInitials,
                        { color: theme.colors.primary },
                      ]}>
                      {initialsFromName(name)}
                    </Text>
                  </View>
                )}
                {statusText ? (
                  <View
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
                      {statusText}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    {photos.length}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: theme.colors.textMuted },
                    ]}>
                    {t('profile.stat_photos')}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    {friendCount}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: theme.colors.textMuted },
                    ]}>
                    {t('profile.stat_friends')}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    {likeCount}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: theme.colors.textMuted },
                    ]}>
                    {t('profile.stat_likes')}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.nameBlock}>
              <Text
                style={[styles.name, { color: theme.colors.text }]}
                numberOfLines={1}>
                {displayAge != null ? `${name}, ${displayAge}` : name}
              </Text>
              <View style={styles.usernameRow}>
                <Text
                  style={[styles.username, { color: theme.colors.textMuted }]}
                  numberOfLines={1}>
                  {formatUsername(profile.Username)}
                </Text>
              </View>
              {statusText ? (
                <View
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: theme.colors.surfaceAlt,
                      borderColor: theme.colors.border,
                    },
                  ]}>
                  <Text
                    style={[styles.statusChipText, { color: theme.colors.text }]}
                    numberOfLines={2}>
                    {statusText}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.body}>
          <Text
            style={[styles.bioFieldLabel, { color: theme.colors.textMuted }]}>
            {t('profile.bio')}
          </Text>
          <View
            style={[
              styles.bioField,
              !hasBio && styles.bioFieldEmpty,
              {
                backgroundColor: hasBio
                  ? theme.colors.card
                  : theme.colors.surfaceAlt,
                borderColor: hasBio
                  ? theme.colors.border
                  : theme.colors.borderStrong,
              },
            ]}>
            <Text
              style={[
                hasBio ? styles.bio : styles.bioPlaceholder,
                {
                  color: hasBio
                    ? theme.colors.text
                    : theme.colors.textMuted,
                },
              ]}>
              {hasBio ? profile.Bio : t('user_profile.bio_empty')}
            </Text>
          </View>

          {photos.length > 0 ? (
            <ProfilePhotoGrid photos={photos} editable={false} />
          ) : null}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('profile.interests')}
            </Text>

            {interests.length > 0 ? (
              <View style={styles.tileGrid}>
                {interests.map(item => (
                  <View key={item.key} style={styles.tileWrap}>
                    <View
                      style={[
                        styles.tile,
                        {
                          backgroundColor: theme.colors.primarySoft,
                          borderColor: theme.colors.primary,
                        },
                        theme.shadows.sm,
                      ]}>
                      <View style={styles.tileTop}>
                        <View
                          style={[
                            styles.emojiBadge,
                            { backgroundColor: theme.colors.primary },
                          ]}>
                          <Text style={styles.emojiText}>{item.emoji}</Text>
                        </View>
                        <View
                          style={[
                            styles.checkDot,
                            { backgroundColor: theme.colors.primary },
                          ]}>
                          <Text
                            style={[
                              styles.checkGlyph,
                              { color: theme.colors.onPrimary },
                            ]}>
                            ✓
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.tileTitle,
                          { color: theme.colors.textMuted },
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail">
                        {item.label}
                      </Text>
                      <Text
                        style={[styles.tileValue, { color: theme.colors.text }]}
                        numberOfLines={1}
                        ellipsizeMode="tail">
                        {item.value}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View
                style={[
                  styles.emptyInterests,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderColor: theme.colors.borderStrong,
                  },
                ]}>
                <Text
                  style={[
                    styles.emptyInterestsText,
                    { color: theme.colors.textMuted },
                  ]}>
                  {t('profile.interests_empty')}
                </Text>
              </View>
            )}
          </View>
        </View>
        </ScrollView>
      </SafeAreaView>

      {!isSelf ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.stickyDock,
            {
              // Flush to the physical bottom so scroll content cannot peek
              // through the gap under the CTAs; pad lifts the buttons above
              // the floating tab pill.
              bottom: 0,
              paddingBottom: dock.dockBottom + dock.dockPaddingBottom,
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
            },
          ]}>
          {areFriends ? (
            <>
              <Pressable
                key="message"
                onPress={onMessagePress}
                disabled={busy}
                style={[
                  styles.actionBtn,
                  styles.actionBtnPrimary,
                  {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                    opacity: busy ? 0.7 : 1,
                  },
                ]}>
                <Text
                  style={[
                    styles.actionBtnLabel,
                    { color: theme.colors.onPrimary },
                  ]}>
                  {t('user_profile.message')}
                </Text>
              </Pressable>
              <Pressable
                key="unfriend"
                onPress={onUnfriend}
                disabled={busy}
                style={[
                  styles.actionBtn,
                  styles.actionBtnSecondary,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderColor: theme.colors.border,
                    opacity: busy ? 0.7 : 1,
                  },
                ]}>
                <Text
                  style={[
                    styles.actionBtnLabel,
                    { color: theme.colors.danger },
                  ]}>
                  {t('user_profile.unfriend')}
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              key="friend-action"
              onPress={onFriendAction}
              disabled={
                busy ||
                isSelf ||
                relation === FriendshipRelation.PendingOutgoing
              }
              style={[
                styles.actionBtn,
                styles.actionBtnPrimary,
                {
                  opacity: busy ? 0.7 : 1,
                  backgroundColor:
                    relation === FriendshipRelation.PendingOutgoing
                      ? theme.colors.surfaceAlt
                      : theme.colors.primary,
                  borderColor:
                    relation === FriendshipRelation.PendingOutgoing
                      ? theme.colors.border
                      : theme.colors.primary,
                },
              ]}>
              <Text
                style={[
                  styles.actionBtnLabel,
                  {
                    color:
                      relation === FriendshipRelation.PendingOutgoing
                        ? theme.colors.text
                        : theme.colors.onPrimary,
                  },
                ]}>
                {friendLabel}
              </Text>
            </Pressable>
          )}
        </View>
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
  stickyDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 40,
    elevation: 40,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: DOCK_PAD_TOP,
    borderTopWidth: StyleSheet.hairlineWidth,
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
    gap: 12,
    marginTop: 4,
    overflow: 'visible',
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: 'relative',
    overflow: 'visible',
    zIndex: 5,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 1.5,
  },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 26, fontWeight: '700' },
  statusBubble: {
    position: 'absolute',
    top: -6,
    left: -4,
    maxWidth: AVATAR_SIZE + 36,
    minWidth: 32,
    minHeight: 28,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 20,
    elevation: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBubbleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center', gap: 2, flex: 1 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  nameBlock: { gap: 2, paddingRight: 8 },
  name: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  username: { fontSize: 14 },
  body: { paddingHorizontal: 16, paddingTop: 4 },
  bioFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bioField: {
    minHeight: 88,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bioFieldEmpty: {
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  bio: { fontSize: 15, lineHeight: 22 },
  bioPlaceholder: { fontSize: 14, lineHeight: 20 },
  section: { marginTop: 22, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  tileWrap: { width: TILE_WIDTH, height: TILE_HEIGHT },
  tile: {
    flex: 1,
    height: TILE_HEIGHT,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  emojiBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 14 },
  checkDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkGlyph: { fontSize: 11, fontWeight: '700' },
  tileTitle: { fontSize: 11, lineHeight: 14, marginBottom: 2 },
  tileValue: { fontSize: 13, lineHeight: 16, fontWeight: '600' },
  emptyInterests: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 16,
  },
  emptyInterestsText: { fontSize: 13, lineHeight: 18 },
  actionBtn: {
    height: DOCK_ACTION_HEIGHT,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  actionBtnPrimary: {
    flex: 1.4,
    minWidth: 0,
  },
  actionBtnSecondary: {
    flex: 1,
    minWidth: 0,
  },
  actionBtnLabel: { fontSize: 14, fontWeight: '700' },
});

export default UserProfileScreen;
