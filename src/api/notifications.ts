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

type ListResponse = ApiEnvelope & {
  items?: unknown[];
  Items?: unknown[];
  unreadCount?: number;
  UnreadCount?: number;
  visitorsThisWeek?: number;
  VisitorsThisWeek?: number;
  canSeeVisitors?: boolean;
  CanSeeVisitors?: boolean;
};
type CountResponse = ApiEnvelope & { unreadCount?: number; UnreadCount?: number };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

function num(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeNotification(raw: unknown): AppNotification | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = num(row.Id ?? row.id);
  if (id == null || id <= 0) return null;
  const type = String(row.Type ?? row.type ?? '');
  if (type === 'like' || type === 'match') return null;
  const actorRow = asRecord(row.Actor ?? row.actor);
  const actor: NotificationActor | null = actorRow
    ? {
        userId: num(actorRow.UserId ?? actorRow.userId) ?? 0,
        firstName: String(actorRow.FirstName ?? actorRow.firstName ?? ''),
        lastName: String(actorRow.LastName ?? actorRow.lastName ?? ''),
        username: String(actorRow.Username ?? actorRow.username ?? ''),
        profileImage: (actorRow.ProfileImage ??
          actorRow.profileImage) as string | null | undefined,
      }
    : null;
  const created = row.CreatedDate ?? row.createdDate;
  return {
    id,
    type,
    entityId: num(row.EntityId ?? row.entityId),
    body: (row.Body ?? row.body) as string | null | undefined,
    isRead: Boolean(row.IsRead ?? row.isRead),
    createdDate:
      typeof created === 'string'
        ? created
        : created instanceof Date
          ? created.toISOString()
          : new Date().toISOString(),
    locked: Boolean(row.Locked ?? row.locked),
    actor,
  };
}

async function withResolvedActor(item: AppNotification): Promise<AppNotification> {
  if (!item.actor?.profileImage) return item;
  const uri = await resolveMediaUrl(item.actor.profileImage);
  if (!uri || uri === item.actor.profileImage) return item;
  return { ...item, actor: { ...item.actor, profileImage: uri } };
}

export async function fetchNotifications(take = 50): Promise<NotificationList> {
  const res = await apiRequest<ListResponse>(API_PATHS.notifications, {
    query: { take },
  });
  const rawItems = res.items ?? res.Items ?? [];
  const items = (
    await Promise.all(
      rawItems.map(async row => {
        const item = normalizeNotification(row);
        return item ? withResolvedActor(item) : null;
      }),
    )
  ).filter((item): item is AppNotification => Boolean(item));
  return {
    items,
    unreadCount: res.unreadCount ?? res.UnreadCount ?? 0,
    visitorsThisWeek: res.visitorsThisWeek ?? res.VisitorsThisWeek ?? 0,
    canSeeVisitors: res.canSeeVisitors ?? res.CanSeeVisitors ?? false,
  };
}

export async function fetchNotificationUnreadCount(): Promise<number> {
  const res = await apiRequest<CountResponse>(API_PATHS.notificationsUnreadCount);
  return res.unreadCount ?? res.UnreadCount ?? 0;
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest<CountResponse>(API_PATHS.notificationsReadAll, { method: 'POST' });
}

export async function clearAllNotifications(): Promise<void> {
  await apiRequest<CountResponse>(API_PATHS.notificationsClear, { method: 'POST' });
}

export async function markNotificationRead(id: number): Promise<number> {
  const res = await apiRequest<CountResponse>(API_PATHS.notificationRead(id), {
    method: 'POST',
  });
  return res.unreadCount ?? res.UnreadCount ?? 0;
}

export function notificationActorName(actor?: NotificationActor | null): string {
  if (!actor) return '';
  const full = `${actor.firstName} ${actor.lastName}`.trim();
  return full || actor.username;
}
