import { NativeModules, Platform } from 'react-native';
import { appStorage } from '../utils/appStorage';

const STORAGE_KEY = 'meerk.language';

function normalize(code: string): string {
  const normalized = (code || 'en').replace('_', '-').split(/[-;]/)[0].toLowerCase();
  return normalized || 'en';
}

function readDeviceLanguage(): string {
  try {
    if (Platform.OS === 'ios') {
      const settings = NativeModules.SettingsManager?.settings;
      const raw =
        settings?.AppleLocale ||
        settings?.AppleLanguages?.[0] ||
        Intl.DateTimeFormat().resolvedOptions().locale;
      if (raw) {
        return normalize(String(raw));
      }
    } else {
      const raw =
        NativeModules.I18nManager?.localeIdentifier ||
        Intl.DateTimeFormat().resolvedOptions().locale;
      if (raw) {
        return normalize(String(raw));
      }
    }
  } catch {
    // Fall through to English.
  }
  return 'en';
}

let currentLanguageCode = readDeviceLanguage();

export function setApiLanguageCode(code: string) {
  currentLanguageCode = normalize(code);
  void appStorage.setItem(STORAGE_KEY, currentLanguageCode);
}

export function getApiLanguageCode() {
  return currentLanguageCode;
}

export async function hydrateApiLanguageCode(): Promise<boolean> {
  const stored = await appStorage.getItem(STORAGE_KEY);
  if (stored) {
    currentLanguageCode = normalize(stored);
    return true;
  }
  return false;
}
