import { API_PATHS } from '../config/api';
import { apiRequest, ApiEnvelope } from './client';

export type LanguageDto = {
  Id: number;
  Name: string;
  Code: string;
  CultureCode?: string | null;
  IsDefault: number;
  IsActive: number;
};

export type LanguagesResponse = ApiEnvelope & {
  GetAllLanguagesQueryCommonObject: LanguageDto[];
};

export type TranslationsResponse = ApiEnvelope & {
  LanguageCode: string;
  CultureCode?: string | null;
  LanguageId: number;
  Translations: Record<string, string>;
};

export function fetchLanguages() {
  return apiRequest<LanguagesResponse>(API_PATHS.languages);
}

export function fetchTranslationsByCode(languageCode: string) {
  return apiRequest<TranslationsResponse>(API_PATHS.translationsByCode, {
    query: { languageCode },
  });
}
