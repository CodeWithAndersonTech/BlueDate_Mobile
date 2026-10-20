import { API_PATHS } from '../config/api';
import { apiRequest, ApiEnvelope } from './client';
import { resolveMediaUrl } from './photos';

export type NotificationType =
  | 'message'
  | 'friend_request'
  | 'friend_accepted'
  | 'treat_request'
  | 'treat_accepted'
  | 'treat_rejected'
  | 'profile_visit'
  | 'nearby_new';

export type NotificationActor = {
  userId: number;
  firstName: string;
  lastName: string;
  username: string;
  profileImage?: string | null;
};

export type AppNotification = {
  id: number;
  type: NotificationType | string;
  entityId?: number | null;
  body?: string | null;
  isRead: boolean;
  createdDate: string;
  /** Visitor hidden for non-premium users; tapping opens Premium. */
  locked: boolean;
  actor?: NotificationActor | null;
};

export type NotificationList = {
  items: AppNotification[];
  unreadCount: number;
  visitorsThisWeek: number;
  canSeeVisitors: boolean;
};

type ListResponse = ApiEnvelope & Partial<NotificationList>;
type CountResponse = ApiEnvelope & { unreadCount?: number };

export async function fetchNotifications(take = 50): Promise<NotificationList> {
  const res = await apiRequest<ListResponse>(API_PATHS.notifications, { query: { take } });
  const items = await Promise.all(
    (res.items ?? [])
      .filter(item => item.type !== 'like' && item.type !== 'match')
      .map(async item => ({
      ...item,
      actor: item.actor
        ? {
            ...item.actor,
            profileImage:
              (await resolveMediaUrl(item.actor.profileImage)) ?? item.actor.profileImage,
          }
        : null,
    })),
  );
  return {
    items,
    unreadCount: res.unreadCount ?? 0,
    visitorsThisWeek: res.visitorsThisWeek ?? 0,
    canSeeVisitors: res.canSeeVisitors ?? false,
  };
}

export async function fetchNotificationUnreadCount(): Promise<number> {
  const res = await apiRequest<CountResponse>(API_PATHS.notificationsUnreadCount);
  return res.unreadCount ?? 0;
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest<CountResponse>(API_PATHS.notificationsReadAll, { method: 'POST' });
}

export async function markNotificationRead(id: number): Promise<number> {
  const res = await apiRequest<CountResponse>(API_PATHS.notificationRead(id), { method: 'POST' });
  return res.unreadCount ?? 0;
}

export function notificationActorName(actor?: NotificationActor | null): string {
  if (!actor) return '';
  const full = `${actor.firstName} ${actor.lastName}`.trim();
  return full || actor.username;
}
