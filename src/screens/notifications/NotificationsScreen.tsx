import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  Avatar,
  EmptyState,
  Header,
  Icon,
  IconName,
  Screen,
  Typography,
} from '../../components';
import { useLocale } from '../../i18n';
import { useScreenBottomPad } from '../../navigation/tabBarLayout';
import { AppStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import {
  AppNotification,
  AppNotificationType,
  appNotifications,
} from '../../utils';

type Props = NativeStackScreenProps<AppStackParamList, 'Notifications'>;

const TYPE_ICON: Record<AppNotificationType, IconName> = {
  like: 'heart',
  match: 'sparkles',
  visit: 'eye',
  friend_request: 'user-plus',
  friend_accept: 'user-check',
  message: 'message',
};

const TYPE_COPY_KEY: Record<AppNotificationType, string> = {
  like: 'notifications.type.like',
  match: 'notifications.type.match',
  visit: 'notifications.type.visit',
  friend_request: 'notifications.type.friend_request',
  friend_accept: 'notifications.type.friend_accept',
  message: 'notifications.type.message',
};

export function NotificationsScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const bottomPad = useScreenBottomPad(24);
  const [items, setItems] = useState<AppNotification[]>(appNotifications);

  const unreadTotal = useMemo(
    () => items.reduce((n, item) => n + (item.unread ? 1 : 0), 0),
    [items],
  );

  const markAllRead = () => {
    setItems(prev => prev.map(item => ({ ...item, unread: false })));
  };

  const onPressItem = (item: AppNotification) => {
    setItems(prev =>
      prev.map(n => (n.id === item.id ? { ...n, unread: false } : n)),
    );

    if (item.conversationId) {
      navigation.navigate('ChatThread', {
        conversationId: item.conversationId,
      });
      return;
    }

    navigation.navigate('UserProfile', { userId: item.userId });
  };

  return (
    <Screen edges={['top']}>
      <Header
        title={t('notifications.title')}
        subtitle={
          unreadTotal > 0
            ? t('notifications.subtitle_unread').replace(
                '{count}',
                String(unreadTotal),
              )
            : t('notifications.subtitle')
        }
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={t('common.back')}
        actions={
          unreadTotal > 0
            ? [
                {
                  icon: 'check',
                  onPress: markAllRead,
                  accessibilityLabel: t('notifications.mark_all_read'),
                },
              ]
            : undefined
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPad, flexGrow: 1 },
        ]}>
        {items.length === 0 ? (
          <EmptyState
            fill
            icon="bell"
            title={t('notifications.empty_title')}
            description={t('notifications.empty_desc')}
          />
        ) : (
          items.map(item => {
            const body = t(TYPE_COPY_KEY[item.type]).replace(
              '{name}',
              item.name,
            );
            return (
              <Pressable
                key={item.id}
                onPress={() => onPressItem(item)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: pressed
                      ? theme.colors.surfaceAlt
                      : item.unread
                        ? theme.colors.primarySoft
                        : 'transparent',
                  },
                ]}>
                <View style={styles.avatarWrap}>
                  <Avatar
                    uri={item.avatar}
                    name={item.name}
                    size="md"
                    premium={item.premium}
                  />
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                      },
                    ]}>
                    <Icon
                      name={TYPE_ICON[item.type]}
                      size={12}
                      color={theme.colors.primary}
                      filled={item.type === 'like'}
                    />
                  </View>
                </View>

                <View style={styles.texts}>
                  <Typography
                    variant={item.unread ? 'bodyStrong' : 'body'}
                    numberOfLines={2}
                    style={styles.body}>
                    {body}
                  </Typography>
                  <Typography variant="caption" color="textMuted">
                    {item.createdAt}
                  </Typography>
                </View>

                {item.unread ? (
                  <View
                    style={[
                      styles.unreadDot,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  />
                ) : (
                  <View style={styles.unreadSpacer} />
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 12,
    paddingTop: 4,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  avatarWrap: { position: 'relative' },
  typeBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 4, minWidth: 0 },
  body: { flexShrink: 1 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  unreadSpacer: {
    width: 8,
    height: 8,
  },
});

export default NotificationsScreen;
