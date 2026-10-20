/**
 * Firebase / FCM is wired but dormant until official config files exist.
 *
 * Activate later:
 * 1. Firebase Console → Android app `com.bluedate` + iOS `com.andersontech.bluedate`
 * 2. Copy real files (never commit them):
 *    - android/app/google-services.json
 *    - ios/BlueDate/GoogleService-Info.plist  (add the file to the Xcode target)
 * 3. Xcode → Signing & Capabilities → Push Notifications + Background Modes (Remote notifications)
 * 4. Rebuild native. Autolink stays off until those files exist (`react-native.config.js`).
 *    After they are in place: Android rebuild; iOS `cd ios && pod install` then run.
 * 5. Backend already accepts Device.PushToken via POST /api/Devices/bootstrap.
 *    Server-side FCM send is a later step.
 */
export const FIREBASE_ANDROID_PACKAGE = 'com.bluedate';
export const FIREBASE_IOS_BUNDLE = 'com.andersontech.bluedate';

export const PUSH_STORAGE_KEYS = {
  token: 'push.fcmToken',
  prefs: 'notif.prefs',
} as const;
