import { Platform } from 'react-native';

/**
 * Dev API host.
 * Backend launch profile binds to localhost — iOS Simulator must use localhost.
 * Android emulator reaches the host machine via 10.0.2.2.
 */
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = `http://${DEV_HOST}:5135`;

export const API_PATHS = {
  bootstrapDevice: '/api/UserDevice/bootstrap',
  bindDeviceUser: '/api/UserDevice/bind-user',
  updateDeviceLanguage: '/api/UserDevice/language',
  languages: '/api/Languages',
  translationsByCode: '/api/LanguageTranslations/by-code',
  register: '/api/Authroizations/authorization-register',
  login: '/api/Authroizations/authorization-login',
  userProfile: '/api/User/profile',
  userBio: '/api/User/bio',
  interestTypes: '/api/InterestType',
  userInterestsByUser: '/api/UserInterest/by-user',
  userInterest: '/api/UserInterest',
} as const;
