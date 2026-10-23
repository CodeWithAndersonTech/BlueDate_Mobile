import { LanguageDto } from '../api';

export const FALLBACK_LANGUAGES: LanguageDto[] = [
  {
    Id: 1,
    Name: 'Türkçe',
    Code: 'tr',
    CultureCode: 'tr-TR',
    IsDefault: 0,
    IsActive: 1,
  },
  {
    Id: 2,
    Name: 'English',
    Code: 'en',
    CultureCode: 'en-US',
    IsDefault: 1,
    IsActive: 1,
  },
  {
    Id: 3,
    Name: 'العربية',
    Code: 'ar',
    CultureCode: 'ar-AE',
    IsDefault: 0,
    IsActive: 1,
  },
  {
    Id: 4,
    Name: 'Русский',
    Code: 'ru',
    CultureCode: 'ru-RU',
    IsDefault: 0,
    IsActive: 1,
  },
];

export function primaryLanguageCode(code: string): string {
  return (code || 'en').toLowerCase().split(/[-_]/)[0] || 'en';
}

export function mergeLanguages(remote?: LanguageDto[] | null): LanguageDto[] {
  const list = [...(remote ?? [])];
  const have = new Set(list.map(item => item.Code.toLowerCase()));
  for (const language of FALLBACK_LANGUAGES) {
    if (!have.has(language.Code.toLowerCase())) {
      list.push(language);
    }
  }
  return list.length ? list : FALLBACK_LANGUAGES;
}
