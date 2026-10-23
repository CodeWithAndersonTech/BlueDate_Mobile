import { I18nManager } from 'react-native';
import { primaryLanguageCode } from './languages';

let currentRtl = I18nManager.isRTL;

export function isRtlLanguage(code: string): boolean {
  return primaryLanguageCode(code) === 'ar';
}

export function getCurrentRtl(): boolean {
  return currentRtl;
}

/**
 * Text direction only (Typography writingDirection).
 * Do not I18nManager.forceRTL — that mirrors the whole app (rows, tab, dock)
 * on the next native launch and is why LTR chrome flipped after a reload.
 */
export function syncRtl(code: string): void {
  currentRtl = isRtlLanguage(code);
}
