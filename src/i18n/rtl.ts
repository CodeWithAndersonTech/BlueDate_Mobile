import { I18nManager } from 'react-native';
import { primaryLanguageCode } from './languages';

let currentRtl = I18nManager.isRTL;

export function isRtlLanguage(code: string): boolean {
  return primaryLanguageCode(code) === 'ar';
}

export function getCurrentRtl(): boolean {
  return currentRtl;
}

/** Applies immediately for text direction. Native row flip needs an app restart. */
export function syncRtl(code: string): void {
  const rtl = isRtlLanguage(code);
  currentRtl = rtl;
  I18nManager.allowRTL(true);
  if (I18nManager.isRTL !== rtl) {
    I18nManager.forceRTL(rtl);
  }
}
