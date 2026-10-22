import { Platform } from 'react-native';
import { isEmulator } from 'react-native-device-info';

/**
 * true  = canlı API (TestFlight / App Store)
 * false = lokal debug (simulator / aynı Wi‑Fi)
 */
const USE_PRODUCTION = true;

/** Production API — https://api.meerk.com.tr */
const PROD_API_URL = 'https://api.meerk.com.tr';

/** Lokal debug (USE_PRODUCTION = false) */
const DEV_PORT = 5135;

/**
 * Mac'in Wi‑Fi IP'si — fiziksel telefon/tablet için gerekli.
 * Terminal: ipconfig getifaddr en0
 */
const DEV_MAC_HOST = '172.16.4.115';

let resolvedDevUrl: string | null = null;

function resolveDevHost(emulator: boolean): string {
  if (Platform.OS === 'android') {
    return emulator ? '10.0.2.2' : DEV_MAC_HOST;
  }

  if (Platform.OS === 'ios') {
    return emulator ? '127.0.0.1' : DEV_MAC_HOST;
  }

  return DEV_MAC_HOST;
}

/**
 * Simulator/emülatör ve fiziksel cihaz için doğru host'u seçer.
 * Backend'in tüm arayüzlerde dinlemesi gerekir:
 *   dotnet run --urls "http://0.0.0.0:5135"
 */
export async function getApiBaseUrl(): Promise<string> {
  if (USE_PRODUCTION) {
    return PROD_API_URL;
  }

  if (resolvedDevUrl) {
    return resolvedDevUrl;
  }

  const emulator = await isEmulator();
  const host = resolveDevHost(emulator);
  resolvedDevUrl = `http://${host}:${DEV_PORT}`;

  if (__DEV__) {
    console.log(
      `[API] ${emulator ? 'simulator/emulator' : 'physical device'} → ${resolvedDevUrl}`,
    );
  }

  return resolvedDevUrl;
}

/** @deprecated Use getApiBaseUrl() — kept for quick imports in dev tools */
export const API_BASE_URL = USE_PRODUCTION
  ? PROD_API_URL
  : `http://${Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1'}:${DEV_PORT}`;

export const API_PATHS = {
  bootstrapDevice: '/api/UserDevice/bootstrap',
  bindDeviceUser: '/api/UserDevice/bind-user',
  updateDeviceLanguage: '/api/UserDevice/language',
  languages: '/api/Languages',
  translationsByCode: '/api/LanguageTranslations/by-code',
  register: '/api/Authroizations/authorization-register',
  login: '/api/Authroizations/authorization-login',
  refresh: '/api/Authroizations/refresh',
  changePassword: '/api/Authroizations/change-password',
  sendEmailOtp: '/api/Authroizations/send-email-otp',
  verifyEmailOtp: '/api/Authroizations/verify-email-otp',
  resetPassword: '/api/Authroizations/reset-password',
  userProfile: '/api/User/profile',
  userBio: '/api/User/bio',
  userBasics: '/api/User/basics',
  userStatus: '/api/User/status',
  userSearch: '/api/User/search',
  interestTypes: '/api/InterestType',
  userInterestsByUser: '/api/UserInterest/by-user',
  userInterest: '/api/UserInterest',
  friendshipStatuses: '/api/FriendshipStatus',
  friendshipRequest: '/api/Friendship/request',
  friendshipAccept: '/api/Friendship/accept',
  friendshipReject: '/api/Friendship/reject',
  friendshipCancel: '/api/Friendship/cancel',
  friendshipUnfriend: '/api/Friendship/unfriend',
  friendshipFriends: '/api/Friendship/friends',
  friendshipIncoming: '/api/Friendship/incoming',
  friendshipSent: '/api/Friendship/sent',
  friendshipStatus: '/api/Friendship/status',
  userLike: '/api/UserLike',
  userLikeStatus: '/api/UserLike/status',
  userLikeCount: '/api/UserLike/count',
  userLikeReceived: '/api/UserLike/received',
  socialActivity: '/api/SocialActivity',
  userPhotosByUser: '/api/UserPhoto/by-user',
  userPhotoGallery: '/api/UserPhoto/gallery',
  userPhotoAvatar: '/api/UserPhoto/avatar',
  userPhoto: '/api/UserPhoto',
  story: '/api/Story',
  storyFeed: '/api/Story/feed', 
  storyByUser: '/api/Story/by-user',
  storyById: (id: number) => `/api/Story/${id}`,
  bleDevice: '/api/Ble/device',
  bleToken: '/api/Ble/token',
  bleSightings: '/api/Ble/sightings',
  proximityNearby: '/api/Proximity/nearby',
  proximityReset: '/api/Proximity/reset',
  conversations: '/api/Conversation',
  conversationDirect: '/api/Conversation/direct',
  conversationUnreadCount: '/api/Conversation/unread-count',
  conversationMessages: (id: number) => `/api/Conversation/${id}/messages`,
  conversationRead: (id: number) => `/api/Conversation/${id}/read`,
  messageDelete: (id: number) => `/api/Message/${id}`,
  userFilter: '/api/UserFilter',
  userPremium: '/api/UserPremium',
  safetyBlock: '/api/UserSafety/block',
  safetyUnblock: '/api/UserSafety/block',
  safetyBlocks: '/api/UserSafety/blocks',
  safetyStatus: '/api/UserSafety/status',
  safetyReport: '/api/UserSafety/report',
  safetyReportAndBlock: '/api/UserSafety/report-and-block',
  notifications: '/api/Notification',
  notificationsUnreadCount: '/api/Notification/unread-count',
  notificationsReadAll: '/api/Notification/read-all',
  notificationsClear: '/api/Notification/clear',
  notificationRead: (id: number) => `/api/Notification/${id}/read`,
  treat: '/api/Treat',
  treatQuote: '/api/Treat/quote',
  treatById: (id: number) => `/api/Treat/${id}`,
  treatAccept: (id: number) => `/api/Treat/${id}/accept`,
  treatReject: (id: number) => `/api/Treat/${id}/reject`,
  userPreference: '/api/UserPreference',
  premiumProducts: '/api/UserPremium/products',
  premiumPurchase: '/api/UserPremium/purchase',
  storyFootprints: '/api/Story/footprints',
} as const;
