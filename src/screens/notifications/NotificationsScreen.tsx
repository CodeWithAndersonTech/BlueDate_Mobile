import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { EmptyState, Header, Icon, Screen, Typography } from '../../components';
import { useLocale } from '../../i18n';
import { useNotifications } from '../../navigation/NotificationsContext';
import { useScreenBottomPad } from '../../navigation/tabBarLayout';
import { AppStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { NotificationRow } from './NotificationRow';
import { useOpenNotification } from './notificationMeta';

type Props = NativeStackScreenProps<AppStackParamList, 'Notifications'>;

export function NotificationsScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const bottomPad = useScreenBottomPad(24);
  const {
    items,
    unreadCount,
    visitorsThisWeek,
    canSeeVisitors,
    initialLoading,
    refresh,
    markAllRead,
  } = useNotifications();
  const openNotification = useOpenNotification();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <Header
        title={t('notifications.title')}
        subtitle={
          unreadCount > 0
            ? t('notifications.subtitle_unread').replace('{count}', String(unreadCount))
            : t('notifications.subtitle')
        }
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={t('common.back')}
        actions={
          unreadCount > 0
            ? [
                {
                  icon: 'check',
                  onPress: () => {
                    void markAllRead();
                  },
                  accessibilityLabel: t('notifications.mark_all_read'),
                },
              ]
            : undefined
        }
      />

      {initialLoading && items.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad, flexGrow: 1 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }>
          {visitorsThisWeek > 0 ? (
            <Pressable
              disabled={canSeeVisitors}
              onPress={() => navigation.navigate('Premium')}
              style={[
                styles.visitorCard,
                { backgroundColor: theme.colors.premiumSoft, borderColor: theme.colors.premium },
              ]}>
              <Icon name="eye" size={20} color={theme.colors.premium} />
              <View style={styles.visitorTexts}>
                <Typography variant="bodyStrong">
                  {t('notif.visitors_week').replace('{count}', String(visitorsThisWeek))}
                </Typography>
                {!canSeeVisitors ? (
                  <Typography variant="caption" color="premium">
                    {t('notif.upgrade_to_see')}
                  </Typography>
                ) : null}
              </View>
              {!canSeeVisitors ? (
                <Icon name="chevron-right" size={18} color={theme.colors.premium} />
              ) : null}
            </Pressable>
          ) : null}

          {items.length === 0 ? (
            <EmptyState
              fill
              icon="bell"
              title={t('notifications.empty_title')}
              description={t('notifications.empty_desc')}
            />
          ) : (
            items.map(item => (
              <NotificationRow key={item.id} item={item} onPress={openNotification} />
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: 12,
    paddingTop: 4,
    gap: 2,
  },
  visitorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 4,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  visitorTexts: { flex: 1, gap: 2 },
});

export default NotificationsScreen;
