import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components';
import {
  acceptFriendRequest,
  FriendshipRelation,
  getFriendshipStatus,
  getLikeCount,
  getLikeStatus,
  getUserProfile,
  likeUser,
  resolveMediaUrl,
  sendFriendRequest,
  unlikeUser,
  UserProfileInterest,
  UserProfileResponse,
} from '../../api';
import { useLocale } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { useLockTabSwipe } from '../../navigation/useLockTabSwipe';
import {
  loadProfilePhotos,
  ProfilePhoto,
} from '../../services/photos/photoStore';
import { useTheme } from '../../theme';
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
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { userId: meId, accessToken } = useAuth();
  const targetId = Number(route.params.userId);

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [relation, setRelation] = useState(FriendshipRelation.None);
  const [friendshipId, setFriendshipId] = useState<number | null>(null);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(targetId) || targetId <= 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);
    try {
      const [profileRes, photoBundle] = await Promise.all([
        getUserProfile(targetId, accessToken),
        loadProfilePhotos(targetId, accessToken).catch(() => ({
          gallery: [] as ProfilePhoto[],
          avatarUri: undefined as string | undefined,
        })),
      ]);
      setProfile(profileRes);
      setPhotos(photoBundle.gallery);
      const profileAvatar = await resolveMediaUrl(profileRes.ProfileImage);
      setAvatarUri(photoBundle.avatarUri ?? profileAvatar);

      if (meId && meId !== targetId) {
        const [statusRes, likeStatusRes, likeCountRes] = await Promise.all([
          getFriendshipStatus(meId, targetId, accessToken),
          getLikeStatus(meId, targetId, accessToken),
          getLikeCount(targetId, accessToken),
        ]);
        setRelation(statusRes.Relation ?? FriendshipRelation.None);
        setFriendshipId(statusRes.FriendshipId ?? null);
        setHasLiked(!!likeStatusRes.HasLiked);
        setLikeCount(likeCountRes.Count ?? 0);
      } else {
        const likeCountRes = await getLikeCount(targetId, accessToken);
        setLikeCount(likeCountRes.Count ?? 0);
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
    if (!meId || !profile || busy) return;
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
    if (!meId || !profile || busy || meId === targetId) return;
    setBusy(true);
    try {
      if (hasLiked) {
        await unlikeUser(meId, targetId, accessToken);
        setHasLiked(false);
        setLikeCount(c => Math.max(0, c - 1));
      } else {
        await likeUser(meId, targetId, accessToken);
        setHasLiked(true);
        setLikeCount(c => c + 1);
      }
    } catch (error) {
      Alert.alert(
        t('user_profile.like'),
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
        style={[styles.root, { backgroundColor: theme.colors.background }]}>
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
        style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          barStyle={theme.isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            style={[
              styles.topBarBtn,
              { backgroundColor: theme.colors.surfaceAlt },
            ]}>
            <Text style={[styles.topBarGlyph, { color: theme.colors.text }]}>
              ‹
            </Text>
          </Pressable>
          <Text style={[styles.topBarTitle, { color: theme.colors.text }]}>
            {t('user_profile.title')}
          </Text>
          <View style={styles.topBarBtnSpacer} />
        </View>
        <EmptyState
          icon="user"
          title={t('user_profile.not_found_title')}
          description={t('user_profile.not_found_desc')}
        />
      </SafeAreaView>
    );
  }

  const hasBio = (profile.Bio ?? '').trim().length > 0;
  const isSelf = meId === targetId;

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 16) + 88,
        }}>
        <View style={styles.header}>
          <View style={styles.topBar}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              style={[
                styles.topBarBtn,
                { backgroundColor: theme.colors.surfaceAlt },
              ]}>
              <Text style={[styles.topBarGlyph, { color: theme.colors.text }]}>
                ‹
              </Text>
            </Pressable>

            <View style={styles.topBarActions}>
              {!isSelf ? (
                <Pressable
                  onPress={onToggleLike}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={
                    hasLiked ? t('user_profile.liked') : t('user_profile.like')
                  }
                  style={[
                    styles.topBarBtn,
                    { backgroundColor: theme.colors.surfaceAlt },
                  ]}>
                  <Text
                    style={[
                      styles.topBarGlyph,
                      {
                        color: hasLiked
                          ? theme.colors.danger
                          : theme.colors.text,
                      },
                    ]}>
                    {hasLiked ? '♥' : '♡'}
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.topBarBtnSpacer} />
              )}
            </View>
          </View>

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
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {photos.length}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                  {t('profile.photos')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {likeCount}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                  {t('user_profile.like')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {profile.IsVerified ? '✓' : '—'}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                  {t('user_profile.stat_age')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.nameBlock}>
            <Text
              style={[styles.name, { color: theme.colors.text }]}
              numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.usernameRow}>
              <Text
                style={[styles.username, { color: theme.colors.textMuted }]}
                numberOfLines={1}>
                {formatUsername(profile.Username)}
              </Text>
            </View>
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

      {!isSelf ? (
        <View
          style={[
            styles.actionDock,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
            },
          ]}>
          <Pressable
            onPress={() => {}}
            style={[
              styles.actionBtn,
              styles.actionBtnSecondary,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.border,
              },
            ]}>
            <Text style={[styles.actionBtnLabel, { color: theme.colors.text }]}>
              {t('user_profile.message')}
            </Text>
          </Pressable>
          <Pressable
            onPress={onFriendAction}
            disabled={
              busy ||
              isSelf ||
              relation === FriendshipRelation.Friends ||
              relation === FriendshipRelation.PendingOutgoing
            }
            style={[
              styles.actionBtn,
              styles.actionBtnPrimary,
              {
                opacity: busy ? 0.7 : 1,
                backgroundColor:
                  relation === FriendshipRelation.Friends ||
                  relation === FriendshipRelation.PendingOutgoing
                    ? theme.colors.surfaceAlt
                    : theme.colors.primary,
                borderColor:
                  relation === FriendshipRelation.Friends ||
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
                    relation === FriendshipRelation.Friends ||
                    relation === FriendshipRelation.PendingOutgoing
                      ? theme.colors.text
                      : theme.colors.onPrimary,
                },
              ]}>
              {friendLabel}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    minHeight: 44,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarBtnSpacer: { width: 36, height: 36 },
  topBarGlyph: { fontSize: 22, fontWeight: '500', marginTop: -1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: 'relative',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 1.5,
  },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 26, fontWeight: '700' },
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
  actionDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSecondary: {},
  actionBtnPrimary: {},
  actionBtnLabel: { fontSize: 14, fontWeight: '700' },
});

export default UserProfileScreen;
