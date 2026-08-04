import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Avatar,
  Icon,
  IconButton,
  IconName,
  TabScreenScrollView,
  Typography,
} from '../../components';
import { getUserProfile } from '../../api';
import { useLocale } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { HomeStackParamList } from '../../navigation/types';
import { ThemeColors, useTheme } from '../../theme';
import { ActivityItem } from '../../utils';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeFeed'>;

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
  const [firstName, setFirstName] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  // Real activity API will populate this — no mock feed.
  const [recentActivity] = useState<ActivityItem[]>([]);
  const [likeCount] = useState(0);
  const goToTab = (tab: string) => navigation.getParent()?.navigate(tab as never);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let cancelled = false;
      getUserProfile(userId, accessToken)
        .then(profile => {
          if (cancelled) return;
          const name = `${profile.FirstName} ${profile.LastName}`.trim();
          setFirstName(profile.FirstName?.trim() || profile.Username || '');
          setFullName(name || profile.Username || '');
          setAvatarUri(profile.ProfileImage ?? undefined);
        })
        .catch(() => {
          /* keep last known greeting */
        });
      return () => {
        cancelled = true;
      };
    }, [userId, accessToken]),
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
              premium
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
              onPress={() => {}}
              accessibilityLabel={t('home.messages')}
            />
            <IconButton name="bell" onPress={() => {}} />
          </View>
        </View>

        <Pressable
          onPress={() => goToTab('Nearby')}
          style={[
            styles.search,
            {
              backgroundColor: theme.colors.surfaceAlt,
            },
          ]}>
          <Icon name="search" size={18} color={theme.colors.textMuted} />
          <Typography variant="callout" color="textMuted">
            {t('home.search_placeholder')}
          </Typography>
        </Pressable>

        <Pressable
          onPress={() => goToTab('Premium')}
          style={({ pressed }) => [
            styles.hero,
            {
              opacity: pressed ? 0.94 : 1,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            },
            theme.shadows.md,
          ]}>
          <LinearGradient
            colors={theme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <View style={styles.heroPill}>
              <Icon name="crown" size={12} color="#3A2A00" filled />
              <Typography variant="overline" tint="#3A2A00">
                {t('home.hero_badge')}
              </Typography>
            </View>
            <Typography variant="h2" tint="#FFFFFF" style={styles.heroTitle}>
              {t('home.hero_title').replace('{count}', String(likeCount))}
            </Typography>
            <Typography variant="callout" tint="rgba(255,255,255,0.82)">
              {t('home.hero_subtitle')}
            </Typography>
            <View style={styles.heroCta}>
              <Typography variant="bodyStrong" tint={theme.colors.textInverse}>
                {t('home.hero_cta')}
              </Typography>
              <Icon
                name="chevron-right"
                size={16}
                color={theme.colors.textInverse}
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
                const meta = ACTIVITY_META[item.type];
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
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greetingText: { gap: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  hero: {
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 200,
  },
  heroContent: {
    padding: 24,
    gap: 10,
  },
  heroPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F5D76E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  heroTitle: { marginTop: 4 },
  heroCta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  section: { gap: 14 },
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
