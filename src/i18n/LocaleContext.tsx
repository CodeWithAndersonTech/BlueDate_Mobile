import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  bindDeviceUser,
  bootstrapDevice,
  fetchLanguages,
  fetchTranslationsByCode,
  LanguageDto,
  updateDeviceLanguage,
} from '../api';
import { setApiLanguageCode } from '../api/languageHeader';
import { getDeviceLaunchInfo } from '../utils/deviceInfo';

type LocaleStatus = 'loading' | 'ready' | 'error';

type DeviceState = {
  id: number | null;
  uniqueId: string;
  languageCode: string;
  cultureCode: string | null;
  theme: string;
  userId: number | null;
  isNew: boolean;
};

interface LocaleContextValue {
  status: LocaleStatus;
  error: string | null;
  languageCode: string;
  languages: LanguageDto[];
  translations: Record<string, string>;
  device: DeviceState | null;
  t: (key: string, fallback?: string) => string;
  setLanguage: (code: string) => Promise<void>;
  bindUser: (userId: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const FALLBACK_LANGUAGES: LanguageDto[] = [
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
];

const FALLBACK_TRANSLATIONS: Record<string, string> = {
  'auth.login_title': 'Welcome back',
  'auth.login_subtitle': 'Sign in to continue',
  'auth.email_or_phone': 'Email or phone',
  'auth.password': 'Password',
  'auth.forgot_password': 'Forgot password',
  'auth.login': 'Log In',
  'auth.or_continue': 'or continue with',
  'auth.no_account': "Don't have an account?",
  'auth.register': 'Sign Up',
  'auth.register_title': 'Create account',
  'auth.register_subtitle': 'Join the community, meet new people.',
  'auth.first_name': 'First name',
  'auth.last_name': 'Last name',
  'auth.email': 'Email',
  'auth.confirm_password': 'Confirm password',
  'auth.password_hint': 'At least 8 characters',
  'auth.confirm_password_hint': 'Re-enter your password',
  'auth.terms_prefix': 'By continuing you accept the',
  'auth.terms_of_use': 'Terms of Use',
  'auth.and': 'and',
  'auth.privacy_policy': 'Privacy Policy',
  'auth.terms_suffix': '.',
  'auth.already_have_account': 'Already have an account?',
  'auth.language': 'Language',
  'auth.password_mismatch': 'Passwords do not match',
  'auth.password_min': 'Password must be at least 8 characters',
  'auth.confirm_required': 'Please confirm your password',
  'auth.first_name_placeholder': 'Your first name',
  'auth.last_name_placeholder': 'Your last name',
  'auth.email_placeholder': 'name@mail.com',
  'auth.username': 'Username',
  'auth.username_placeholder': 'username',
  'auth.username_taken': 'This username is already taken',
  'auth.username_required': 'Username is required',
  'auth.username_length': 'Username must be between 3 and 50 characters',
  'auth.email_invalid': 'Enter a valid email address',
  'auth.email_required': 'Email is required',
  'auth.email_exists': 'This email is already registered',
  'auth.invalid_credentials': 'Invalid email or password',
  'auth.login_success': 'Login successful',
  'auth.register_success': 'User created successfully',
  'auth.identifier_invalid': 'Enter a valid email or phone number',
  'auth.verify_title': 'Verify email',
  'auth.verify_heading': 'Enter verification code',
  'auth.verify_subtitle': 'We sent a 6-digit code to',
  'auth.verify_action': 'Verify',
  'auth.verify_resend': 'Resend code',
  'auth.verify_resend_in': 'Resend code in',
  'auth.verify_invalid_code': 'Invalid code. Try 111111 for now.',
  'auth.gender': 'Gender',
  'auth.gender_required': 'Please select a gender',
  'gender.men': 'Men',
  'gender.woman': 'Woman',
  'gender.other': 'Other',
  'common.google': 'Google',
  'common.phone': 'Phone',
  'common.apple': 'Apple',
};

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<LocaleStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [languageCode, setLanguageCode] = useState('en');
  const [languages, setLanguages] = useState<LanguageDto[]>(FALLBACK_LANGUAGES);
  const [translations, setTranslations] = useState<Record<string, string>>(
    FALLBACK_TRANSLATIONS,
  );
  const [device, setDevice] = useState<DeviceState | null>(null);

  const loadTranslations = useCallback(async (code: string) => {
    setApiLanguageCode(code);
    const response = await fetchTranslationsByCode(code);
    setTranslations({
      ...FALLBACK_TRANSLATIONS,
      ...(response.Translations ?? {}),
    });
    const nextCode = response.LanguageCode || code;
    setApiLanguageCode(nextCode);
    setLanguageCode(nextCode);
  }, []);

  const bootstrap = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const info = await getDeviceLaunchInfo();
      console.log('[DeviceInfo]', info);
      setApiLanguageCode(info.language);

      const theme =
        info.colorScheme === 'unspecified' ? 'light' : info.colorScheme;

      const [deviceResponse, languagesResponse] = await Promise.all([
        bootstrapDevice({
          DeviceUniqueId: info.uniqueId,
          Platform: info.platform,
          OsVersion: info.osVersion,
          LanguageCode: info.language,
          CultureCode: info.cultureCode,
          Theme: theme,
          PushToken: null,
        }),
        fetchLanguages(),
      ]);

      const nextDevice: DeviceState = {
        id: deviceResponse.Id,
        uniqueId: deviceResponse.DeviceUniqueId,
        languageCode: deviceResponse.LanguageCode,
        cultureCode: deviceResponse.CultureCode ?? null,
        theme: deviceResponse.Theme,
        userId: deviceResponse.UserId ?? null,
        isNew: deviceResponse.IsNew,
      };

      setDevice(nextDevice);
      setLanguages(
        languagesResponse.GetAllLanguagesQueryCommonObject?.length
          ? languagesResponse.GetAllLanguagesQueryCommonObject
          : FALLBACK_LANGUAGES,
      );
      await loadTranslations(nextDevice.languageCode);
      setStatus('ready');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to bootstrap locale';
      console.warn('[Locale] bootstrap failed', err);
      setLanguages(FALLBACK_LANGUAGES);
      setError(message);
      setStatus('error');
    }
  }, [loadTranslations]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const setLanguage = useCallback(
    async (code: string) => {
      setApiLanguageCode(code);
      setLanguageCode(code);

      try {
        if (device?.uniqueId) {
          const updated = await updateDeviceLanguage({
            DeviceUniqueId: device.uniqueId,
            LanguageCode: code,
          });

          setDevice(prev =>
            prev
              ? {
                  ...prev,
                  languageCode: updated.LanguageCode,
                  cultureCode: updated.CultureCode ?? null,
                }
              : prev,
          );
          await loadTranslations(updated.LanguageCode);
          return;
        }

        await loadTranslations(code);
      } catch (err) {
        console.warn('[Locale] setLanguage failed, keeping local code', err);
      }
    },
    [device?.uniqueId, loadTranslations],
  );

  const bindUser = useCallback(
    async (userId: number) => {
      if (!device?.uniqueId) {
        return;
      }

      const bound = await bindDeviceUser({
        DeviceUniqueId: device.uniqueId,
        UserId: userId,
      });

      setDevice(prev =>
        prev
          ? {
              ...prev,
              userId: bound.UserId ?? userId,
            }
          : prev,
      );
    },
    [device?.uniqueId],
  );

  const t = useCallback(
    (key: string, fallback?: string) =>
      translations[key] ?? fallback ?? FALLBACK_TRANSLATIONS[key] ?? key,
    [translations],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      status,
      error,
      languageCode,
      languages,
      translations,
      device,
      t,
      setLanguage,
      bindUser,
      refresh: bootstrap,
    }),
    [
      status,
      error,
      languageCode,
      languages,
      translations,
      device,
      t,
      setLanguage,
      bindUser,
      bootstrap,
    ],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used inside a <LocaleProvider />');
  }
  return ctx;
}
