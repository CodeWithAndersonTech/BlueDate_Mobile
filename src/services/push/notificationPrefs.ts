import { appStorage } from '../../utils/appStorage';
import { PUSH_STORAGE_KEYS } from '../../config/firebase';

export type NotificationPrefs = {
  push: boolean;
  matches: boolean;
  messages: boolean;
  marketing: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  push: true,
  matches: true,
  messages: true,
  marketing: false,
};

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const raw = await appStorage.getItem(PUSH_STORAGE_KEYS.prefs);
  if (!raw) {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
  try {
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

export async function setNotificationPrefs(
  next: NotificationPrefs,
): Promise<void> {
  await appStorage.setItem(PUSH_STORAGE_KEYS.prefs, JSON.stringify(next));
}

export async function patchNotificationPref<K extends keyof NotificationPrefs>(
  key: K,
  value: NotificationPrefs[K],
): Promise<NotificationPrefs> {
  const current = await getNotificationPrefs();
  const next = { ...current, [key]: value };
  await setNotificationPrefs(next);
  return next;
}
