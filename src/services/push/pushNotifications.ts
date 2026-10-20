import { PermissionsAndroid, Platform } from 'react-native';
import { bootstrapDevice } from '../../api/device';
import { PUSH_STORAGE_KEYS } from '../../config/firebase';
import { isFirebaseNativeLinked } from '../../config/firebaseNative';
import { getDeviceLaunchInfo } from '../../utils/deviceInfo';
import { appStorage } from '../../utils/appStorage';
import { getNotificationPrefs } from './notificationPrefs';

type MessagingApi = typeof import('@react-native-firebase/messaging');

let cachedToken: string | null = null;
let started = false;
let unsubscribeFns: Array<() => void> = [];

function loadMessaging(): MessagingApi | null {
  if (!isFirebaseNativeLinked()) {
    return null;
  }
  try {
    return require('@react-native-firebase/messaging') as MessagingApi;
  } catch {
    return null;
  }
}

function isNativeFirebaseReady(): boolean {
  if (!isFirebaseNativeLinked()) {
    return false;
  }
  try {
    const { getApp } = require('@react-native-firebase/app') as {
      getApp: () => unknown;
    };
    getApp();
    return loadMessaging() != null;
  } catch {
    return false;
  }
}

export function getCachedPushToken(): string | null {
  return cachedToken;
}

export async function getStoredPushToken(): Promise<string | null> {
  if (cachedToken) {
    return cachedToken;
  }
  const stored = await appStorage.getItem(PUSH_STORAGE_KEYS.token);
  cachedToken = stored;
  return stored;
}

async function persistToken(token: string | null): Promise<void> {
  cachedToken = token;
  if (token) {
    await appStorage.setItem(PUSH_STORAGE_KEYS.token, token);
    return;
  }
  await appStorage.removeItem(PUSH_STORAGE_KEYS.token);
}

export async function syncPushTokenToServer(
  token: string | null,
): Promise<void> {
  try {
    const info = await getDeviceLaunchInfo();
    const theme =
      info.colorScheme === 'unspecified' ? 'light' : info.colorScheme;
    await bootstrapDevice({
      DeviceUniqueId: info.uniqueId,
      Platform: info.platform,
      OsVersion: info.osVersion,
      LanguageCode: info.language,
      CultureCode: info.cultureCode,
      Theme: theme,
      PushToken: token,
    });
  } catch (error) {
    console.warn('[Push] token sync skipped', error);
  }
}

async function requestOsPermission(messagingApi: MessagingApi): Promise<boolean> {
  if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  const status = await messagingApi.requestPermission(messagingApi.getMessaging());
  return (
    status === messagingApi.AuthorizationStatus.AUTHORIZED ||
    status === messagingApi.AuthorizationStatus.PROVISIONAL
  );
}

async function registerCurrentToken(messagingApi: MessagingApi): Promise<string | null> {
  const messaging = messagingApi.getMessaging();
  if (
    Platform.OS === 'ios' &&
    !messagingApi.isDeviceRegisteredForRemoteMessages(messaging)
  ) {
    await messagingApi.registerDeviceForRemoteMessages(messaging);
  }
  const token = await messagingApi.getToken(messaging);
  await persistToken(token);
  await syncPushTokenToServer(token);
  return token;
}

function attachListeners(messagingApi: MessagingApi): void {
  const messaging = messagingApi.getMessaging();
  unsubscribeFns.forEach(fn => fn());
  unsubscribeFns = [
    messagingApi.onTokenRefresh(messaging, token => {
      void persistToken(token).then(() => syncPushTokenToServer(token));
    }),
    messagingApi.onMessage(messaging, message => {
      console.log('[Push] foreground', message.messageId ?? message.data);
    }),
    messagingApi.onNotificationOpenedApp(messaging, message => {
      console.log('[Push] opened', message.messageId ?? message.data);
    }),
  ];

  void messagingApi.getInitialNotification(messaging).then(message => {
    if (message) {
      console.log('[Push] launched', message.messageId ?? message.data);
    }
  });
}

/**
 * Safe to call on every launch. No-ops until google-services / Info.plist
 * exist and the user left push enabled in Settings.
 */
export async function initPushNotifications(): Promise<string | null> {
  const prefs = await getNotificationPrefs();
  if (!prefs.push) {
    return getStoredPushToken();
  }
  return enablePushNotifications();
}

export async function enablePushNotifications(): Promise<string | null> {
  if (!isNativeFirebaseReady()) {
    return getStoredPushToken();
  }

  const messagingApi = loadMessaging();
  if (!messagingApi) {
    return null;
  }

  try {
    const allowed = await requestOsPermission(messagingApi);
    if (!allowed) {
      return null;
    }
    if (!started) {
      attachListeners(messagingApi);
      started = true;
    }
    return await registerCurrentToken(messagingApi);
  } catch (error) {
    console.warn('[Push] enable skipped — Firebase not configured yet', error);
    return null;
  }
}

export async function disablePushNotifications(): Promise<void> {
  unsubscribeFns.forEach(fn => fn());
  unsubscribeFns = [];
  started = false;
  await persistToken(null);
  await syncPushTokenToServer(null);

  if (!isNativeFirebaseReady()) {
    return;
  }
  const messagingApi = loadMessaging();
  if (!messagingApi) {
    return;
  }
  try {
    await messagingApi.deleteToken(messagingApi.getMessaging());
  } catch (error) {
    console.warn('[Push] deleteToken skipped', error);
  }
}

