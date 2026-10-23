import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import {
  getInterestTypes,
  getUserProfile,
  parseInterestTypes,
  InterestTypeItem,
  resolveMediaUrl,
  updateUserStatus,
  UserProfileResponse,
} from '../../api';
import {
  EmptyState,
  FigmaButton,
  FigmaIcon,
  StatusEditModal,
  TabScreenScrollView,
  Typography,
  useScreenTopPad,
} from '../../components';
import { useLocale, userFacingError } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { useTabBarClearance } from '../../navigation/tabBarLayout';
import { ProfileStackParamList } from '../../navigation/types';
import {
  assetFromPickerResponse,
  pickPhotoFromLibrary,
} from '../../services/photos/pickImage';
import {
  mergePhotoLists,
  peekCachedAvatar,
  photosFromProfile,
  pickAndSetAvatar,
  preferDisplayAvatar,
  ProfilePhoto,
  rememberAvatar,
} from '../../services/photos/photoStore';
import { prefetchMediaUris } from '../../services/photos/prefetchMedia';
import { useTheme } from '../../theme';
import { afterUiSettled } from '../../utils/afterUiSettled';
import { breadcrumb } from '../../utils/crashLog';
import { zodiacSymbolFromBirthDate } from '../../utils/zodiac';
import { useHideTabBar } from '../../navigation/useHideTabBar';
const LazyPhotoViewer = React.lazy(async () => {
  const mod = await import('./PhotoViewerModal');
  return { default: mod.PhotoViewerModal };
});
import { ProfileSkeleton } from './ProfileSkeleton';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;

const PROFILE_STALE_MS = 20_000;
const COVER_RATIO = 478 / 393;
const AVATAR_RATIO = 82 / 393;

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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const topPad = useScreenTopPad();
  const tabClearance = useTabBarClearance(24);
  // Width-scaled Figma cover (~56% of a short 852pt frame) eats a Pro Max
  // and leaves Hakkımda under the tab bar with nothing to scroll.
  const coverH = Math.round(
    Math.min(windowWidth * COVER_RATIO, windowHeight * 0.3, 280),
  );
  const avatarSize = Math.round(windowWidth * AVATAR_RATIO);
  const { userId, accessToken } = useAuth();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [interestTypes, setInterestTypes] = useState<InterestTypeItem[]>([]);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyTipOpen, setVerifyTipOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const [coverIndex, setCoverIndex] = useState(0);
  useHideTabBar(avatarViewerOpen || statusModalOpen);
  const statusText = (() => {
    const text = (profile?.StatusText ?? '').trim();
    if (!text) return '';
    const expiresAt = profile?.StatusExpiresAt;
    if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) return '';
    return text;
  })();
  // Start at 1 so skeleton → content never flashes a blank frame.
  const contentOpacity = useSharedValue(1);
  const profileRef = useRef<UserProfileResponse | null>(null);
  profileRef.current = profile;
  const lastLoadAt = useRef(0);
  const closeVerifyTip = () => setVerifyTipOpen(false);

  const loadProfile = useCallback(
    async (isRefresh = false) => {
      if (!userId) {
        setError(t('profile.session_missing'));
        setLoading(false);
        return;
      }
      if (
        !isRefresh &&
        profileRef.current &&
        lastLoadAt.current > 0 &&
        Date.now() - lastLoadAt.current < PROFILE_STALE_MS
      ) {
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
        const profileResponse = await getUserProfile(userId, accessToken);
        if (!Number(profileResponse?.Id)) {
          throw new Error('profile-empty');
        }
        setError(null);

        try {
          const [interestTypesResponse, fromProfile] = await Promise.all([
            getInterestTypes(accessToken).catch(() => null),
            photosFromProfile(profileResponse.Photos),
          ]);
          const profileAvatar = await resolveMediaUrl(
            profileResponse.ProfileImage,
          ).catch(() => undefined);
          const nextAvatar = preferDisplayAvatar(
            profileAvatar,
            peekCachedAvatar(userId),
          );
          const gallery = mergePhotoLists(fromProfile);
          setProfile(profileResponse);
          setInterestTypes(parseInterestTypes(interestTypesResponse));
          setPhotos(gallery);
          setAvatarUri(nextAvatar);
          lastLoadAt.current = Date.now();
          if (userId && nextAvatar) {
            rememberAvatar(userId, nextAvatar);
          }
          void prefetchMediaUris(
            [nextAvatar, ...gallery.map(p => p.uri)],
            2000,
          );
        } catch (extraErr) {
          if (__DEV__) {
            console.warn('[Profile] extras failed', extraErr);
          }
          setProfile(profileResponse);
          lastLoadAt.current = Date.now();
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('[Profile] load failed', err);
        }
        if (!profileRef.current) {
          setError(userFacingError(err, t, 'profile.load_failed'));
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId, accessToken, t],
  );

  useFocusEffect(
    useCallback(() => {
      return afterUiSettled(() => {
        void loadProfile();
      }, 50);
    }, [loadProfile]),
  );

  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const fullName = profile
    ? `${profile.FirstName} ${profile.LastName}`.trim()
    : '';
  const zodiacSymbol = zodiacSymbolFromBirthDate(profile?.BirthDate);
  const displayName = (() => {
    if (!fullName) return '';
    const parts: string[] = [fullName];
    if (typeof profile?.Age === 'number') {
      parts.push(String(profile.Age));
    }
    let line = parts.join(', ');
    if (zodiacSymbol) {
      line = `${line} ${zodiacSymbol}`;
    }
    return line;
  })();
  const bio = (typeof profile?.Bio === 'string' ? profile.Bio : '').trim();
  const hasBio = bio.length > 0;
  const interests = Array.isArray(profile?.Interests) ? profile.Interests : [];
  const hasInterests = interests.length > 0;
  const interestsComplete =
    interestTypes.length > 0 &&
    interestTypes.every(type =>
      interests.some(
        item =>
          Number(item.InterestTypeId) === Number(type.Id) &&
          (item.Value ?? '').trim().length > 0,
      ),
    );
  const hasPhoto =
    photos.length > 0 ||
    Boolean(typeof avatarUri === 'string' && avatarUri.trim()) ||
    Boolean(
      typeof profile?.ProfileImage === 'string' && profile.ProfileImage.trim(),
    );
  const isVerified = interestsComplete && hasPhoto;

  const saveStatus = async (next: string) => {
    if (!userId) return;
    breadcrumb('status_save_start', { len: String(next.length) });
    setStatusSaving(true);
    try {
      const res = await updateUserStatus(
        { UserId: userId, StatusText: next },
        accessToken,
      );
      setProfile(prev =>
        prev
          ? {
              ...prev,
              StatusText: res.StatusText ?? null,
              StatusExpiresAt: res.StatusExpiresAt ?? null,
            }
          : prev,
      );
      setStatusModalOpen(false);
      breadcrumb('status_save_ok');
    } catch (error) {
      breadcrumb('status_save_fail', {
        message:
          error instanceof Error ? error.message.slice(0, 80) : 'unknown',
      });
      Alert.alert(
        t('profile.status_title'),
        userFacingError(error, t, 'profile.status_error'),
      );
    } finally {
      setStatusSaving(false);
    }
  };

  const onChangeAvatar = async () => {
    if (!userId) return;
    const result = await pickPhotoFromLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
    });
    if (result.didCancel) return;
    if (result.errorCode === 'permission') {
      Alert.alert(t('profile.change_avatar'), t('profile.photo_permission'));
      return;
    }
    if (result.errorMessage === 'NATIVE_MODULE_MISSING') {
      Alert.alert(t('profile.change_avatar'), t('profile.photo_native_missing'));
      return;
    }
    const asset = assetFromPickerResponse(result);
    if (!asset) {
      Alert.alert(t('profile.change_avatar'), t('profile.photo_error'));
      return;
    }
    try {
      const uri = await pickAndSetAvatar(userId, asset, accessToken);
      setAvatarUri(uri);
      setProfile(prev => (prev ? { ...prev, ProfileImage: uri } : prev));
    } catch {
      Alert.alert(t('profile.change_avatar'), t('profile.photo_error'));
    }
  };

  const coverPhotos = useMemo<ProfilePhoto[]>(() => {
    const seen = new Set<string>();
    const rows: ProfilePhoto[] = [];
    const push = (photo: ProfilePhoto) => {
      if (!photo.uri || seen.has(photo.uri)) return;
      seen.add(photo.uri);
      rows.push(photo);
    };
    photos.forEach(push);
    if (avatarUri) {
      push({ id: 'avatar', uri: avatarUri, sortOrder: -1 });
    }
    return rows;
  }, [photos, avatarUri]);

  const coverPhoto = coverPhotos[Math.min(coverIndex, Math.max(coverPhotos.length - 1, 0))];

  const viewerPhotos = useMemo<ProfilePhoto[]>(() => {
    const seen = new Set<string>();
    const rows: ProfilePhoto[] = [];
    const push = (photo: ProfilePhoto) => {
      if (!photo.uri || seen.has(photo.uri)) return;
      seen.add(photo.uri);
      rows.push(photo);
    };
    if (avatarUri) {
      push({ id: 'avatar', uri: avatarUri, sortOrder: -1 });
    }
    photos.forEach(push);
    return rows;
  }, [photos, avatarUri]);

  const openPhotoViewer = useCallback(
    (startUri?: string) => {
      const list = viewerPhotos;
      if (list.length === 0) {
        return;
      }
      let start = 0;
      if (startUri) {
        const idx = list.findIndex(item => item.uri === startUri);
        if (idx >= 0) {
          start = idx;
        }
      }
      void Image.prefetch(list[start]?.uri ?? startUri ?? '').catch(() => undefined);
      setMoreOpen(false);
      setViewerStartIndex(start);
      afterUiSettled(() => setAvatarViewerOpen(true));
    },
    [viewerPhotos],
  );

  const onAvatarPress = () => {
    if (avatarUri) {
      openPhotoViewer(avatarUri);
      return;
    }
    void onChangeAvatar();
  };

  const openViewer = () => {
    openPhotoViewer(coverPhoto?.uri);
  };

  const goPreview = () => {
    setMoreOpen(false);
    if (!userId) return;
    afterUiSettled(() => {
      navigation.navigate('UserProfile', { userId: String(userId) });
    });
  };

  const goSettings = () => {
    setMoreOpen(false);
    afterUiSettled(() => navigation.navigate('Settings'));
  };

  const goEdit = (params?: {
    focus?: 'bio' | 'interests';
    interestTypeId?: number;
  }) => {
    setMoreOpen(false);
    afterUiSettled(() => {
      if (params) {
        navigation.navigate('EditProfile', params);
        return;
      }
      navigation.navigate('EditProfile' as never);
    });
  };

  const shell = (children: React.ReactNode, bleed = false) => (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.colors.background,
          overflow: 'visible',
          paddingTop: bleed ? 0 : topPad,
        },
      ]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.flex}>{children}</View>
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
      {avatarViewerOpen ? (
        <React.Suspense fallback={null}>
          <LazyPhotoViewer
            photos={viewerPhotos}
            index={Math.min(
              viewerStartIndex,
              Math.max(viewerPhotos.length - 1, 0),
            )}
            editable={false}
            onClose={() => setAvatarViewerOpen(false)}
            onIndexChange={setViewerStartIndex}
          />
        </React.Suspense>
      ) : null}
      {moreOpen ? (
        <View pointerEvents="box-none" style={styles.moreHost}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setMoreOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          />
          <View
            style={[
              styles.moreMenu,
              {
                top: topPad + 44,
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}>
            <Pressable
              onPress={goPreview}
              style={styles.moreRow}
              accessibilityRole="button">
              <Typography variant="callout">{t('profile.preview')}</Typography>
            </Pressable>
            <Pressable
              onPress={goSettings}
              style={styles.moreRow}
              accessibilityRole="button">
              <Typography variant="callout">{t('settings.title')}</Typography>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );

  const showSkeleton = loading && !profile;

  if (showSkeleton) {
    return shell(
      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.skeletonContent}
        scrollEnabled={false}>
        <ProfileSkeleton />
      </ScrollView>,
      true,
    );
  }

  if (error && !profile) {
    return shell(
      <View style={[styles.center, { paddingBottom: tabClearance }]}>
        <EmptyState
          fill
          figmaIcon="rotateRight"
          title={t('profile.load_failed')}
          description={error}
          actionLabel={t('profile.retry')}
          onAction={() => {
            void loadProfile();
          }}
        />
      </View>,
    );
  }

  if (!profile) {
    return shell(<View />);
  }

  const interestCards =
    interestTypes.length > 0
      ? interestTypes.map(type => {
          const existing = interests.find(
            item =>
              Number(item.InterestTypeId) === Number(type.Id) ||
              item.InterestTypeName === type.Name,
          );
          const value = existing?.Value?.trim() ?? '';
          return {
            key: String(type.Id),
            label: type.Name,
            value,
            emoji: interestEmoji(type),
            typeId: type.Id,
          };
        })
      : interests.map(item => ({
          key: String(item.Id),
          label: item.InterestTypeName || t('profile.interests'),
          value: item.Value?.trim() ?? '',
          emoji: '✨',
          typeId:
            item.InterestTypeId != null ? Number(item.InterestTypeId) : undefined,
        }));

  return shell(
    <Animated.View style={[styles.flex, contentFadeStyle]}>
      <TabScreenScrollView
        bottomSpacing={32}
        alwaysBounceVertical
        onScrollBeginDrag={closeVerifyTip}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProfile(true)}
            tintColor={theme.colors.plusCta}
          />
        }>
        <View style={[styles.coverWrap, { height: coverH }]}>
          {coverPhoto ? (
            <Pressable
              onPress={openViewer}
              delayPressIn={160}
              style={StyleSheet.absoluteFill}
              accessibilityRole="imagebutton"
              accessibilityLabel={t('profile.view_avatar')}>
              <Image
                source={{ uri: coverPhoto.uri }}
                style={styles.cover}
                fadeDuration={0}
                resizeMode="cover"
              />
            </Pressable>
          ) : (
            <View
              style={[
                styles.cover,
                { backgroundColor: theme.colors.plusSoft },
              ]}
            />
          )}
          <View style={[styles.coverShade, { height: avatarSize }]} />
          <View style={[styles.coverBar, { paddingTop: topPad }]}>
            <View style={styles.coverBarSide} />
            {coverPhotos.length > 1 ? (
              <View
                style={[styles.pager, { backgroundColor: theme.colors.white }]}
              />
            ) : (
              <View style={styles.coverBarSide} />
            )}
            <Pressable
              onPress={() => setMoreOpen(open => !open)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('settings.title')}
              style={styles.coverBarSide}>
              <FigmaIcon
                name="moreDots"
                size={24}
                color={coverPhoto ? theme.colors.white : theme.colors.text}
              />
            </Pressable>
          </View>
          {coverPhotos.length > 1 ? (
            <>
              <Pressable
                onPress={() =>
                  setCoverIndex(
                    i => (i - 1 + coverPhotos.length) % coverPhotos.length,
                  )
                }
                hitSlop={12}
                style={[styles.coverArrow, styles.coverArrowLeft]}
                accessibilityRole="button"
                accessibilityLabel={t('common.back')}>
                <View style={styles.coverArrowIcon}>
                  <FigmaIcon
                    name="arrowRight"
                    size={15}
                    color={theme.colors.white}
                  />
                </View>
              </Pressable>
              <Pressable
                onPress={() =>
                  setCoverIndex(i => (i + 1) % coverPhotos.length)
                }
                hitSlop={12}
                style={[styles.coverArrow, styles.coverArrowRight]}
                accessibilityRole="button"
                accessibilityLabel={t('profile.photos')}>
                <FigmaIcon
                  name="arrowRight"
                  size={15}
                  color={theme.colors.white}
                />
              </Pressable>
            </>
          ) : null}
        </View>

        <View style={[styles.identity, { marginTop: -avatarSize / 2 }]}>
          <Pressable
            onPress={onAvatarPress}
            onLongPress={() => setStatusModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={
              avatarUri ? t('profile.view_avatar') : t('profile.change_avatar')
            }
            style={[
              styles.avatarRing,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                borderColor: theme.colors.background,
                backgroundColor: theme.colors.surfaceAlt,
              },
            ]}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                fadeDuration={0}
                style={{
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                }}
              />
            ) : (
              <Typography variant="h2" tint={theme.colors.plusCta}>
                {initialsFromName(fullName)}
              </Typography>
            )}
          </Pressable>
          <Typography variant="h2" align="center" numberOfLines={1}>
            {displayName}
          </Typography>
          {statusText ? (
            <Pressable
              onPress={() => setStatusModalOpen(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('profile.status_title')}>
              <Typography variant="callout" color="textMuted" align="center">
                {statusText}
              </Typography>
            </Pressable>
          ) : null}
          {!isVerified ? (
            <Pressable
              onPress={() => setVerifyTipOpen(open => !open)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('profile.not_verified')}>
              <Typography variant="caption" tint={theme.colors.danger} align="center">
                {t('profile.not_verified')}
              </Typography>
            </Pressable>
          ) : null}
          {verifyTipOpen ? (
            <View
              style={[
                styles.verifyTip,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}>
              <Typography variant="caption">{t('profile.verify_requires_interests')}</Typography>
              <Pressable
                onPress={() => {
                  closeVerifyTip();
                  goEdit();
                }}>
                <Typography variant="caption" weight="600" tint={theme.colors.plusCta}>
                  {t('profile.edit')}
                </Typography>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.favGrid}>
            {interestCards.map(card => (
              <Pressable
                key={card.key}
                onPress={() =>
                  goEdit({
                    focus: 'interests',
                    interestTypeId: card.typeId,
                  })
                }
                style={[
                  styles.favCard,
                  { backgroundColor: theme.colors.surfaceAlt },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${card.label}: ${
                  card.value || t('edit.add_interest')
                }`}>
                <View
                  style={[
                    styles.favIcon,
                    { backgroundColor: theme.colors.plusSoft },
                  ]}>
                  <Text style={styles.favEmoji}>{card.emoji}</Text>
                </View>
                <View style={styles.favCopy}>
                  <Typography variant="caption" color="textMuted" numberOfLines={1}>
                    {card.label}
                  </Typography>
                  <Typography variant="callout" weight="600" numberOfLines={1}>
                    {card.value || t('edit.add_interest')}
                  </Typography>
                </View>
              </Pressable>
            ))}
          </View>

          <FigmaButton
            label={t('profile.edit_cta')}
            size="cta"
            fullWidth
            onPress={() => goEdit()}
          />

          <View style={styles.about}>
            <Typography variant="title">{t('edit.about')}</Typography>
            <Pressable
              onPress={() => goEdit({ focus: 'bio' })}
              accessibilityRole="button"
              accessibilityLabel={t('edit.about')}>
              <Typography
                variant="callout"
                color={hasBio ? 'text' : 'textMuted'}
                style={styles.aboutBody}>
                {hasBio ? bio : t('profile.add_bio_desc')}
              </Typography>
            </Pressable>
          </View>
        </View>
      </TabScreenScrollView>
    </Animated.View>,
    true,
  );
}


const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  skeletonContent: { flexGrow: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  errorText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  coverWrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#1c1c1e',
  },
  cover: { width: '100%', height: '100%' },
  coverShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  coverBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coverBarSide: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pager: {
    width: 48,
    height: 6,
    borderRadius: 3,
    opacity: 0.85,
  },
  coverArrow: {
    position: 'absolute',
    top: '45%',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverArrowLeft: { left: 10 },
  coverArrowRight: { right: 10 },
  coverArrowIcon: { transform: [{ rotate: '180deg' }] },
  identity: {
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 6,
    zIndex: 2,
  },
  avatarRing: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
  },
  verifyTip: {
    marginTop: 4,
    width: 240,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  body: {
    paddingHorizontal: 10,
    paddingTop: 16,
    gap: 20,
  },
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
  about: { gap: 10, paddingHorizontal: 0, minHeight: 94 },
  aboutBody: { lineHeight: 22 },
  moreHost: {
    ...StyleSheet.absoluteFill,
    zIndex: 30,
  },
  moreMenu: {
    position: 'absolute',
    right: 12,
    minWidth: 180,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  moreRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});


export default ProfileScreen;
