let currentLanguageCode = 'en';

export function setApiLanguageCode(code: string) {
  const normalized = (code || 'en').replace('_', '-').split('-')[0].toLowerCase();
  currentLanguageCode = normalized || 'en';
}

export function getApiLanguageCode() {
  return currentLanguageCode;
}
