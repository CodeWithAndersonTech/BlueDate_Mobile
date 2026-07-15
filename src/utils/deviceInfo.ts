import { Appearance, NativeModules, Platform } from 'react-native';
import { getSystemVersion, getUniqueId } from 'react-native-device-info';

export type DeviceLaunchInfo = {
  platform: 'ios' | 'android' | string;
  uniqueId: string;
  language: string;
  cultureCode: string;
  colorScheme: 'light' | 'dark' | 'unspecified';
  osVersion: string;
};

function getDeviceLanguage(): string {
  if (Platform.OS === 'ios') {
    const settings = NativeModules.SettingsManager?.settings;
    return (
      settings?.AppleLocale ||
      settings?.AppleLanguages?.[0] ||
      Intl.DateTimeFormat().resolvedOptions().locale ||
      'en'
    );
  }

  return (
    NativeModules.I18nManager?.localeIdentifier ||
    Intl.DateTimeFormat().resolvedOptions().locale ||
    'en'
  );
}

function toCultureCode(language: string): string {
  const normalized = language.replace('_', '-');
  if (normalized.includes('-')) {
    return normalized;
  }
  const primary = normalized.toLowerCase();
  if (primary === 'tr') {
    return 'tr-TR';
  }
  if (primary === 'en') {
    return 'en-US';
  }
  return normalized;
}

function getSystemColorScheme(): DeviceLaunchInfo['colorScheme'] {
  const scheme = Appearance.getColorScheme();
  if (scheme === 'light' || scheme === 'dark') {
    return scheme;
  }
  return 'unspecified';
}

export async function getDeviceLaunchInfo(): Promise<DeviceLaunchInfo> {
  const uniqueId = await getUniqueId();
  const language = getDeviceLanguage();

  return {
    platform: Platform.OS,
    uniqueId,
    language,
    cultureCode: toCultureCode(language),
    colorScheme: getSystemColorScheme(),
    osVersion: getSystemVersion(),
  };
}

export async function logDeviceLaunchInfo(): Promise<void> {
  try {
    const info = await getDeviceLaunchInfo();
    console.log('[DeviceInfo]', info);
  } catch (error) {
    console.warn('[DeviceInfo] Failed to read device info', error);
  }
}
