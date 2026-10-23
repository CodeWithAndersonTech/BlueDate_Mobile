import { appStorage } from '../utils/appStorage';
import type { LanguageDto, TranslationsResponse } from '../api/languages';

const KEY = '@meerk/i18n-pack-v2';
const TTL_MS = 24 * 60 * 60 * 1000;

type Pack = {
  at: number;
  code: string;
  languages?: LanguageDto[];
  translations?: TranslationsResponse;
};

export async function readLocalePack(code: string): Promise<Pack | null> {
  try {
    const raw = await appStorage.getItem(KEY);
    if (!raw) return null;
    const pack = JSON.parse(raw) as Pack;
    if (!pack?.code || pack.code.toLowerCase().split('-')[0] !== code.toLowerCase().split('-')[0]) {
      return null;
    }
    return pack;
  } catch {
    return null;
  }
}

export function isLocalePackFresh(pack: Pack | null): boolean {
  return Boolean(pack && Date.now() - pack.at < TTL_MS);
}

export async function writeLocalePack(pack: Omit<Pack, 'at'>): Promise<void> {
  try {
    const existing = await readLocalePack(pack.code);
    await appStorage.setItem(
      KEY,
      JSON.stringify({
        at: Date.now(),
        code: pack.code,
        languages: pack.languages ?? existing?.languages,
        translations: pack.translations ?? existing?.translations,
      }),
    );
  } catch {
    // ignore
  }
}
