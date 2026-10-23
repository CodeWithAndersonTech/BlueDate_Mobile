import { primaryLanguageCode } from '../languages';
import arPack from './ar.json';
import ruPack from './ru.json';

export const LOCAL_TRANSLATIONS_AR = arPack as Record<string, string>;
export const LOCAL_TRANSLATIONS_RU = ruPack as Record<string, string>;

export function localOverlay(code: string): Record<string, string> {
  const primary = primaryLanguageCode(code);
  if (primary === 'ar') {
    return LOCAL_TRANSLATIONS_AR;
  }
  if (primary === 'ru') {
    return LOCAL_TRANSLATIONS_RU;
  }
  return {};
}
