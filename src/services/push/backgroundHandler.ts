import { isFirebaseNativeLinked } from '../../config/firebaseNative';

/**
 * Must stay free of app/api imports — index.js registers this before App mounts.
 */
export function registerBackgroundMessageHandler(): void {
  if (!isFirebaseNativeLinked()) {
    return;
  }
  try {
    const { getApp } = require('@react-native-firebase/app') as {
      getApp: () => unknown;
    };
    getApp();
    const messaging = require('@react-native-firebase/messaging') as typeof import('@react-native-firebase/messaging');
    messaging.setBackgroundMessageHandler(messaging.getMessaging(), async message => {
      console.log('[Push] background', message.messageId ?? message.data);
    });
  } catch {
    // google-services / plist not present, or native module not linked yet.
  }
}
