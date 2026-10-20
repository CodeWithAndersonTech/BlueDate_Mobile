export {
  DEFAULT_NOTIFICATION_PREFS,
  getNotificationPrefs,
  patchNotificationPref,
  setNotificationPrefs,
  type NotificationPrefs,
} from './notificationPrefs';
export { registerBackgroundMessageHandler } from './backgroundHandler';
export {
  disablePushNotifications,
  enablePushNotifications,
  getCachedPushToken,
  getStoredPushToken,
  initPushNotifications,
  syncPushTokenToServer,
} from './pushNotifications';
