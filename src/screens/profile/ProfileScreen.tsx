import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  getInterestTypes,
  getUserProfile,
  InterestTypeItem,
  UserProfileResponse,
} from '../../api';
import { TabScreenScrollView } from '../../components';
import { useLocale } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { ProfileSkeleton } from './ProfileSkeleton';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;

const AVATAR_SIZE = 86;
const TILE_WIDTH = '48%';
const TILE_HEIGHT = 100;

const INTEREST_EMOJI: { match: RegExp; emoji: string }[] = [
  { match: /food|yemek|yeme/i, emoji: '🍽' },
  { match: /dessert|tatlı|tatl/i, emoji: '🍰' },
  { match: /coffee|kahve/i, emoji: '☕' },
  { match: /drink|beverage|alcohol|alkol|içecek|icecek/i, emoji: '🥤' },
  { match: /music|müzik|muzik/i, emoji: '🎵' },
  { match: /travel|gezi|seyahat/i, emoji: '✈' },
  { match: /fitness|sport|spor/i, emoji: '🏋' },
  { match: /game|oyun/i, emoji: '🎮' },
  { match: /book|kitap/i, emoji: '📚' },
  { match: /movie|film|sinema/i, emoji: '🎬' },
  { match: /art|sanat/i, emoji: '🎨' },
  { match: /nature|doğa|doga/i, emoji: '🌿' },
];

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function interestEmoji(type: InterestTypeItem): string {
  const hay = `${type.Code ?? ''} ${type.Name ?? ''} ${type.KeyName ?? ''}`;
  for (const item of INTEREST_EMOJI) {
    if (item.match.test(hay)) return item.emoji;
  }
  return '✨';
}

export function ProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const { userId, accessToken } = useAuth();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [interestTypes, setInterestTypes] = useState<InterestTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyTipOpen, setVerifyTipOpen] = useState(false);
  const contentOpacity = useSharedValue(0);
  const profileRef = useRef<UserProfileResponse | null>(null);
  profileRef.current = profile;

  const closeVerifyTip = () => setVerifyTipOpen(false);

  const loadProfile = useCallback(
    async (isRefresh = false) => {
      if (!userId) {
        setError(t('profile.session_missing'));
        setLoading(false);
        return;
      }
      // Keep existing content on re-focus; skeleton only when we have nothing yet.
      if (isRefresh) {
        setRefreshing(true);
      } else if (!profileRef.current) {
        setLoading(true);
      }
      setError(null);

      try {
        const [profileResponse, interestTypesResponse] = await Promise.all([
          getUserProfile(userId, accessToken),
          getInterestTypes(accessToken).catch(() => null),
        ]);
        setProfile(profileResponse);
        setInterestTypes(
          [
            ...(interestTypesResponse?.GetAllInterestTypeQueryCommonObject ??
              []),
          ].sort((a, b) => (a.SortOrder ?? 0) - (b.SortOrder ?? 0)),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : t('profile.load_failed'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId, accessToken, t],
  );

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  useEffect(() => {
    if (!loading && profile) {
      contentOpacity.value = withTiming(1, {
        duration: 280,
        easing: Easing.out(Easing.quad),
      });
    } else if (loading && !profile) {
      contentOpacity.value = 0;
    }
  }, [loading, profile, contentOpacity]);

  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const fullName = profile
    ? `${profile.FirstName} ${profile.LastName}`.trim()
    : '';
  const bio = profile?.Bio?.trim() ?? '';
  const hasBio = bio.length > 0;
  const interests = profile?.Interests ?? [];
  const hasInterests = interests.length > 0;
  const isVerified =
    interestTypes.length > 0 &&
    interestTypes.every(type =>
      interests.some(
        item =>
          Number(item.InterestTypeId) === Number(type.Id) &&
          (item.Value ?? '').trim().length > 0,
      ),
    );

  const shell = (children: React.ReactNode) => (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      {children}
    </SafeAreaView>
  );

  const showSkeleton = loading && !profile;

  if (showSkeleton) {
    return shell(
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        scrollEnabled={false}>
        <ProfileSkeleton />
      </ScrollView>,
    );
  }

  if (error && !profile) {
    return shell(
      <View style={styles.center}>
        <Text style={[styles.errorText, { color: theme.colors.danger }]}>
          {error}
        </Text>
        <Pressable
          onPress={() => loadProfile()}
          style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.retryLabel, { color: theme.colors.onPrimary }]}>
            {t('profile.retry')}
          </Text>
        </Pressable>
      </View>,
    );
  }

  if (!profile) {
    return shell(<View />);
  }

  return shell(
    <Animated.View style={[styles.flex, contentFadeStyle]}>
      <TabScreenScrollView
        // One interest-tile row of breathing room under the last tile.
        bottomSpacing={TILE_HEIGHT}
        onScrollBeginDrag={closeVerifyTip}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProfile(true)}
            tintColor={theme.colors.primary}
          />
        }>
        <View style={styles.header}>
          {verifyTipOpen ? (
            <Pressable
              style={styles.verifyTipDismiss}
              onPress={closeVerifyTip}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            />
          ) : null}
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                closeVerifyTip();
                navigation.navigate('EditProfile');
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('profile.edit')}
              style={[
                styles.headerActionBtn,
                { backgroundColor: theme.colors.surfaceAlt },
              ]}>
              <Text
                style={[styles.headerActionGlyph, { color: theme.colors.text }]}>
                ✎
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                closeVerifyTip();
                navigation.navigate('Settings');
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              style={[
                styles.headerActionBtn,
                { backgroundColor: theme.colors.surfaceAlt },
              ]}>
              <Text
                style={[styles.headerActionGlyph, { color: theme.colors.text }]}>
                ⚙
              </Text>
            </Pressable>
          </View>

          <View style={styles.headerTop}>
            <View style={styles.avatarRing}>
              {profile.ProfileImage ? (
                <Image
                  source={{ uri: profile.ProfileImage }}
                  style={[
                    styles.avatar,
                    { borderColor: theme.colors.border },
                  ]}
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
                    {initialsFromName(fullName)}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.onlineDot,
                  {
                    backgroundColor: theme.colors.online,
                    borderColor: theme.colors.background,
                  },
                ]}
              />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  0
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                  {t('profile.stat_friends')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  0
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                  {t('profile.stat_likes')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  0
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.colors.textMuted }]}>
                  {t('profile.stat_visits')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.nameBlock}>
            <View style={styles.nameAnchor}>
              <Text
                style={[styles.name, { color: theme.colors.text }]}
                numberOfLines={1}>
                {fullName}
              </Text>
              {isVerified ? (
                <View
                  style={[
                    styles.verifiedDot,
                    { backgroundColor: theme.colors.primary },
                  ]}>
                  <Text
                    style={[
                      styles.verifiedDotGlyph,
                      { color: theme.colors.onPrimary },
                    ]}>
                    ✓
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.usernameRow}>
              <Text
                style={[styles.username, { color: theme.colors.textMuted }]}
                numberOfLines={1}>
                @{profile.Username}
              </Text>
              {!isVerified ? (
                <View style={styles.notVerifiedWrap}>
                  <Pressable
                    onPress={() => setVerifyTipOpen(open => !open)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={t('profile.not_verified')}
                    accessibilityState={{ expanded: verifyTipOpen }}
                    style={styles.notVerifiedChip}>
                    <Text
                      style={[
                        styles.notVerifiedIcon,
                        { color: theme.colors.danger },
                      ]}>
                      ⓘ
                    </Text>
                    <Text
                      style={[
                        styles.notVerifiedLabel,
                        { color: theme.colors.danger },
                      ]}>
                      {t('profile.not_verified')}
                    </Text>
                  </Pressable>

                  {verifyTipOpen ? (
                    <View
                      style={[
                        styles.verifyTip,
                        {
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.danger,
                        },
                        theme.shadows.sm,
                      ]}>
                      <View
                        style={[
                          styles.verifyTipCaret,
                          {
                            backgroundColor: theme.colors.card,
                            borderColor: theme.colors.danger,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.verifyTipText,
                          { color: theme.colors.text },
                        ]}>
                        {t('profile.verify_requires_interests')}
                      </Text>
                      <Pressable
                        onPress={() => {
                          closeVerifyTip();
                          navigation.navigate('EditProfile');
                        }}
                        hitSlop={8}
                        style={styles.verifyTipAction}>
                        <Text
                          style={[
                            styles.verifyTipActionLabel,
                            { color: theme.colors.danger },
                          ]}>
                          {t('profile.edit')}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View
          style={styles.body}
          onStartShouldSetResponder={() => {
            if (verifyTipOpen) {
              closeVerifyTip();
            }
            return false;
          }}>
          <Text
            style={[styles.bioFieldLabel, { color: theme.colors.textMuted }]}>
            {t('profile.bio')}
          </Text>
          {hasBio ? (
            <Pressable
              onPress={() => navigation.navigate('EditProfile')}
              style={[
                styles.bioField,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}>
              <Text style={[styles.bio, { color: theme.colors.text }]}>
                {bio}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => navigation.navigate('EditProfile')}
              style={[
                styles.bioField,
                styles.bioFieldEmpty,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.borderStrong,
                },
              ]}>
              <Text
                style={[styles.bioPlaceholder, { color: theme.colors.textMuted }]}>
                {t('profile.add_bio_desc')}
              </Text>
            </Pressable>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('profile.interests')}
              </Text>
            </View>

            {interestTypes.length > 0 ? (
              <View style={styles.tileGrid}>
                {interestTypes.map(type => {
                  const existing = interests.find(
                    item =>
                      Number(item.InterestTypeId) === Number(type.Id) ||
                      item.InterestTypeName === type.Name,
                  );
                  const value = existing?.Value?.trim() ?? '';
                  const selected = value.length > 0;
                  return (
                    <Pressable
                      key={type.Id}
                      onPress={() => navigation.navigate('EditProfile')}
                      accessibilityRole="button"
                      accessibilityLabel={`${type.Name}: ${
                        selected ? value : t('edit.add_interest')
                      }`}
                      style={styles.tileWrap}>
                      <View
                        style={[
                          styles.tile,
                          {
                            backgroundColor: selected
                              ? theme.colors.primarySoft
                              : theme.colors.card,
                            borderColor: selected
                              ? theme.colors.primary
                              : theme.colors.border,
                          },
                          theme.shadows.sm,
                        ]}>
                        <View style={styles.tileTop}>
                          <View
                            style={[
                              styles.emojiBadge,
                              {
                                backgroundColor: selected
                                  ? theme.colors.primary
                                  : theme.colors.surfaceAlt,
                              },
                            ]}>
                            <Text style={styles.emojiText}>
                              {interestEmoji(type)}
                            </Text>
                          </View>
                          {selected ? (
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
                          ) : (
                            <Text
                              style={[
                                styles.plusGlyph,
                                { color: theme.colors.textMuted },
                              ]}>
                              +
                            </Text>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.tileTitle,
                            { color: theme.colors.textMuted },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail">
                          {type.Name}
                        </Text>
                        <Text
                          style={[
                            styles.tileValue,
                            {
                              color: selected
                                ? theme.colors.text
                                : theme.colors.textMuted,
                            },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail">
                          {selected ? value : t('edit.add_interest')}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : hasInterests ? (
              <View style={styles.tileGrid}>
                {interests.map(item => (
                  <Pressable
                    key={item.Id}
                    onPress={() => navigation.navigate('EditProfile')}
                    style={styles.tileWrap}>
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
                          <Text style={styles.emojiText}>✨</Text>
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
                        numberOfLines={1}>
                        {item.InterestTypeName || t('profile.interests')}
                      </Text>
                      <Text
                        style={[
                          styles.tileValue,
                          { color: theme.colors.text },
                        ]}
                        numberOfLines={1}>
                        {item.Value}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Pressable
                onPress={() => navigation.navigate('EditProfile')}
                style={[
                  styles.promptCard,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderColor: theme.colors.borderStrong,
                    marginTop: 0,
                  },
                ]}>
                <View style={styles.promptText}>
                  <Text
                    style={[styles.promptTitle, { color: theme.colors.text }]}>
                    {t('profile.add_interests')}
                  </Text>
                  <Text
                    style={[
                      styles.promptDesc,
                      { color: theme.colors.textMuted },
                    ]}>
                    {t('profile.interests_empty')}
                  </Text>
                </View>
                <Text
                  style={{ color: theme.colors.textMuted, fontSize: 18 }}>
                  ›
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </TabScreenScrollView>
    </Animated.View>,
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  muted: { fontSize: 14, textAlign: 'center' },
  errorText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryLabel: { fontSize: 15, fontWeight: '700' },
  header: {
    position: 'relative',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    gap: 12,
    overflow: 'visible',
    zIndex: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  onlineDot: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  headerActions: {
    position: 'absolute',
    top: 2,
    right: 12,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionGlyph: { fontSize: 16, fontWeight: '600' },
  nameBlock: {
    gap: 2,
    paddingRight: 8,
    overflow: 'visible',
    zIndex: 3,
  },
  nameAnchor: {
    position: 'relative',
    alignSelf: 'flex-start',
    maxWidth: '92%',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  verifiedDot: {
    position: 'absolute',
    left: '100%',
    marginLeft: 6,
    top: 1,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedDotGlyph: { fontSize: 10, fontWeight: '700' },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
    zIndex: 4,
    overflow: 'visible',
  },
  username: { fontSize: 14 },
  notVerifiedWrap: {
    position: 'relative',
    zIndex: 5,
  },
  notVerifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  notVerifiedIcon: { fontSize: 12, fontWeight: '600' },
  notVerifiedLabel: { fontSize: 11, fontWeight: '600' },
  verifyTipDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  verifyTipCaret: {
    position: 'absolute',
    top: -5,
    left: 16,
    width: 10,
    height: 10,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    transform: [{ rotate: '45deg' }],
    zIndex: 2,
  },
  verifyTip: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 8,
    width: 220,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
    zIndex: 6,
    elevation: 12,
  },
  verifyTipText: { fontSize: 12, lineHeight: 17 },
  verifyTipAction: { alignSelf: 'flex-start' },
  verifyTipActionLabel: { fontSize: 12, fontWeight: '700' },
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
  promptCard: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  promptText: { flex: 1, gap: 2 },
  promptTitle: { fontSize: 15, fontWeight: '600' },
  promptDesc: { fontSize: 12, lineHeight: 16 },
  statItem: { alignItems: 'center', gap: 2, flex: 1 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  section: { marginTop: 22, gap: 12 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', flexShrink: 1 },
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
  plusGlyph: { fontSize: 18, fontWeight: '500' },
  tileTitle: { fontSize: 11, lineHeight: 14, marginBottom: 2 },
  tileValue: { fontSize: 13, lineHeight: 16, fontWeight: '600' },
});

export default ProfileScreen;
