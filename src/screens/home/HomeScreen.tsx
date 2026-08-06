import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
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
  IconName,
  TabScreenScrollView,
  Typography,
} from '../../components';
import {
  displayName,
  formatRelativeTime,
  getSocialActivity,
  getUserProfile,
  resolveMediaUrl,
} from '../../api';
import { useLocale } from '../../i18n';
import { usePremium } from '../../hooks/usePremium';
import { useAuth } from '../../navigation/AuthContext';
import { useChat } from '../../navigation/ChatContext';
import { HomeStackParamList } from '../../navigation/types';
import { loadProfilePhotos } from '../../services/photos/photoStore';
import { ThemeColors, useTheme } from '../../theme';
import { ActivityItem } from '../../utils';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeFeed'>;

/** Same gold palette as PremiumScreen. */
const GOLD: [string, string] = ['#F5D76E', '#E8A838'];
const ON_GOLD = '#2C2100';

const ACTIVITY_META: Record<
  string,
  { icon: IconName; labelKey: string; color: keyof ThemeColors }
> = {
  match: {
    icon: 'sparkles',
    labelKey: 'home.activity.match',
    color: 'primary',
  },
  like: {
    icon: 'heart',
    labelKey: 'home.activity.like',
    color: 'danger',
  },
  visit: {
    icon: 'eye',
    labelKey: 'home.activity.visit',
    color: 'info',
  },
  request: {
    icon: 'user-plus',
    labelKey: 'home.activity.request',
    color: 'warning',
  },
};

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { userId, accessToken } = useAuth();
  const { unreadCount, refreshUnread } = useChat();
  const { isPremium, refresh: refreshPremium } = usePremium();
  const [firstName, setFirstName] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const goToTab = (tab: string) => navigation.getParent()?.navigate(tab as never);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let cancelled = false;
      refreshUnread();
      void refreshPremium();

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
        } catch {
          /* keep last known greeting */
        }
      })();

      getSocialActivity(userId, 20, accessToken)
        .then(async activity => {
          if (cancelled) return;
          const mapped = await Promise.all(
            (activity.Items ?? activity.items ?? []).map(async item => ({
              id: `${item.Type}-${item.EntityId}`,
              userId: String(item.User.UserId),
              type:
                item.Type === 'friend_request'
                  ? ('request' as const)
                  : ('like' as const),
              name: displayName(item.User),
              avatar:
                (await resolveMediaUrl(item.User.ProfileImage)) ??
                item.User.ProfileImage ??
                undefined,
              time: formatRelativeTime(item.CreatedDate),
            })),
          );
          if (cancelled) return;
          setRecentActivity(mapped);
        })
        .catch(() => {
          /* keep previous activity */
        });

      return () => {
        cancelled = true;
      };
    }, [userId, accessToken, refreshUnread, refreshPremium]),
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
          <Pressable
            style={styles.greeting}
            onPress={() => goToTab('Profile')}>
            <Avatar
              uri={avatarUri}
              name={fullName || firstName || '?'}
              size="md"
              premium={isPremium}
              online
            />
            <View style={styles.greetingText}>
              <Typography variant="caption" color="textMuted">
                {t('home.greeting')}
              </Typography>
              <Typography variant="h3">{firstName || '…'}</Typography>
            </View>
          </Pressable>
          <View style={styles.headerActions}>
            <IconButton
              name="message"
              badge={unreadCount}
              onPress={() =>
                // Bubbles to AppStack above tabs — full-screen, no tab bar.
                navigation.navigate('Messages' as never)
              }
              accessibilityLabel={t('home.messages')}
            />
            <IconButton
              name="bell"
              onPress={() =>
                navigation.navigate('Notifications' as never)
              }
              accessibilityLabel={t('notifications.title')}
            />
          </View>
        </View>

        {!isPremium ? (
          <Pressable
            onPress={() => goToTab('Premium')}
            style={({ pressed }) => [
              styles.premiumCard,
              {
                opacity: pressed ? 0.94 : 1,
                transform: [{ scale: pressed ? 0.985 : 1 }],
              },
              theme.shadows.sm,
            ]}>
            <LinearGradient
              colors={GOLD}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.premiumContent}>
              <View style={styles.premiumTextCol}>
                <View style={styles.premiumBadge}>
                  <Icon name="crown" size={12} color={ON_GOLD} filled />
                  <Typography variant="overline" tint={ON_GOLD}>
                    {t('home.hero_badge')}
                  </Typography>
                </View>
                <Typography variant="title" tint={ON_GOLD} numberOfLines={2}>
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
                <Typography variant="caption" tint={ON_GOLD}>
                  {t('home.hero_cta')}
                </Typography>
                <Icon name="chevron-right" size={14} color={ON_GOLD} />
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
              {recentActivity.map((item, i) => {
                const meta = ACTIVITY_META[item.type] ?? ACTIVITY_META.like;
                return (
                  <View key={item.id}>
                    <Pressable
                      style={styles.activityRow}
                      onPress={() =>
                        navigation.navigate('UserProfile', {
                          userId: item.userId,
                        })
                      }>
                      <Avatar uri={item.avatar} name={item.name} size="md" />
                      <View style={styles.activityText}>
                        <Typography variant="body" numberOfLines={2}>
                          <Typography variant="bodyStrong">
                            {item.name}
                          </Typography>
                          {` ${t(meta.labelKey)}`}
                        </Typography>
                        <Typography variant="caption" color="textMuted">
                          {item.time}
                        </Typography>
                      </View>
                      <View
                        style={[
                          styles.activityIcon,
                          { backgroundColor: theme.colors.surfaceAlt },
                        ]}>
                        <Icon
                          name={meta.icon}
                          size={16}
                          color={theme.colors[meta.color]}
                          filled
                        />
                      </View>
                    </Pressable>
                    {i < recentActivity.length - 1 && (
                      <View
                        style={[
                          styles.sep,
                          { backgroundColor: theme.colors.border },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </TabScreenScrollView>
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
  greeting: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greetingText: { gap: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
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
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  activityText: { flex: 1, gap: 2, minWidth: 0 },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
});

export default HomeScreen;
