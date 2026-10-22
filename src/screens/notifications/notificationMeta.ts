import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import type { AppNotification } from '../../api/notifications';
import type { IconName } from '../../components';
import { useNotifications } from '../../navigation/NotificationsContext';
import type { AppStackParamList } from '../../navigation/types';
import type { ThemeColors } from '../../theme';
import { afterUiSettled } from '../../utils/afterUiSettled';

type Meta = { icon: IconName; labelKey: string; color: keyof ThemeColors };

const META: Record<string, Meta> = {
  message: { icon: 'message', labelKey: 'notif.type.message', color: 'primary' },
  friend_request: { icon: 'user-plus', labelKey: 'notif.type.friend_request', color: 'warning' },
  friend_accepted: { icon: 'user-check', labelKey: 'notif.type.friend_accepted', color: 'success' },
  treat_request: { icon: 'gift', labelKey: 'notif.type.treat_request', color: 'plusCta' },
  treat_accepted: { icon: 'gift', labelKey: 'notif.type.treat_accepted', color: 'success' },
  treat_rejected: { icon: 'gift', labelKey: 'notif.type.treat_rejected', color: 'textMuted' },
  profile_visit: { icon: 'eye', labelKey: 'notif.type.profile_visit', color: 'info' },
  nearby_new: { icon: 'map-pin', labelKey: 'notif.type.nearby_new', color: 'primary' },
};

export function notificationMeta(type: string): Meta {
  return META[type] ?? META.nearby_new;
}

/** Opens the screen a notification points at and marks it read. */
export function useOpenNotification() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { markRead } = useNotifications();

  return useCallback(
    (n: AppNotification) => {
      afterUiSettled(() => {
        if (n.locked) {
          navigation.navigate('Premium');
          return;
        }
        void markRead(n.id);
        const actorId = n.actor?.userId;
        switch (n.type) {
          case 'message':
            if (n.entityId) {
              navigation.navigate('ChatThread', {
                conversationId: String(n.entityId),
              });
            }
            return;
          case 'treat_request':
            if (n.entityId) {
              navigation.navigate('TreatRequest', { treatId: n.entityId });
            }
            return;
          case 'treat_accepted':
          case 'treat_rejected':
            if (n.entityId) {
              navigation.navigate('TreatResult', { treatId: n.entityId });
            }
            return;
          case 'friend_request':
            navigation.navigate('MainTabs', {
              screen: 'Friends',
              params: { screen: 'FriendsMain' },
            });
            return;
          default:
            if (actorId) {
              navigation.navigate('UserProfile', { userId: String(actorId) });
            }
        }
      });
    },
    [navigation, markRead],
  );
}
