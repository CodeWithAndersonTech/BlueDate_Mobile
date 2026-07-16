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
  'auth.forgot_title': 'Reset password',
  'auth.forgot_subtitle':
    'Enter your account email and we will send you a link to reset your password.',
  'auth.forgot_send': 'Send reset link',
  'auth.forgot_back': 'Back to login',
  'auth.forgot_resend': 'Resend link',
  'auth.forgot_sent_title': 'Check your email',
  'auth.forgot_sent_desc': 'We sent a password reset link to',
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
  // Profile
  'profile.edit': 'Edit Profile',
  'profile.edit_action': 'Edit',
  'profile.add_bio': 'Add bio',
  'profile.add_bio_desc':
    'Introduce yourself briefly to make your profile stand out.',
  'profile.stat_friends': 'Friends',
  'profile.stat_likes': 'Likes',
  'profile.stat_visits': 'Visits',
  'profile.interests': 'Interests',
  'profile.add_interests': 'Add interests',
  'profile.categories_ready': 'categories ready. Note your favorites.',
  'profile.interests_empty': 'Complete your profile by adding your favorites.',
  'profile.friends': 'Friends',
  'profile.see_all': 'See all',
  'profile.online': 'Online',
  'profile.offline': 'offline',
  'profile.retry': 'Try again',
  'profile.loading': 'Loading profile...',
  'profile.session_missing': 'Session not found.',
  'profile.load_failed': 'Failed to load profile.',
  'profile.bio': 'Bio',
  'profile.bio_save_failed': 'Failed to save bio.',
  'friends.people': 'people',
  'friends.search': 'Search your friends',
  'friends.mutual': 'mutual',
  // Edit profile
  'edit.title': 'Edit Profile',
  'edit.first_name': 'First name',
  'edit.last_name': 'Last name',
  'edit.username': 'Username',
  'edit.email': 'Email',
  'edit.phone': 'Phone',
  'edit.interests': 'Interests',
  'edit.interests_hint':
    "Write your favorites. Blank ones aren't saved; existing answers are updated.",
  'edit.answer_placeholder': 'Your {name} answer...',
  'edit.save': 'Save',
  'edit.saving': 'Saving...',
  'edit.loading': 'Loading profile info...',
  'edit.profile': 'Profile',
  'edit.session_missing': 'Session not found.',
  'edit.load_failed': 'Failed to load profile.',
  'edit.interests_alert': 'Interests',
  'edit.min_one_interest': 'Enter at least one interest answer.',
  'edit.save_failed': 'Failed to save.',
};

/**
 * Turkish overrides for keys the backend does not (yet) provide. Backend
 * translations always win; these guarantee correct Turkish copy offline and
 * for screen-local strings that only live in the app.
 */
const LOCAL_TRANSLATIONS_TR: Record<string, string> = {
  'profile.edit': 'Profili Düzenle',
  'profile.edit_action': 'Düzenle',
  'profile.add_bio': 'Biyografi ekle',
  'profile.add_bio_desc':
    'Kendini kısaca tanıt, profilin daha dikkat çeksin.',
  'profile.stat_friends': 'Arkadaş',
  'profile.stat_likes': 'Beğeni',
  'profile.stat_visits': 'Ziyaret',
  'profile.interests': 'İlgi alanları',
  'profile.add_interests': 'İlgi alanlarını ekle',
  'profile.categories_ready': 'kategori hazır. Favorilerini yaz.',
  'profile.interests_empty': 'Favorilerini yazarak profilini tamamla.',
  'profile.friends': 'Arkadaşlar',
  'profile.see_all': 'Tümünü gör',
  'profile.online': 'Çevrimiçi',
  'profile.offline': 'çevrimdışı',
  'profile.retry': 'Tekrar dene',
  'profile.loading': 'Profil yükleniyor...',
  'profile.session_missing': 'Oturum bilgisi bulunamadı.',
  'profile.load_failed': 'Profil yüklenemedi.',
  'profile.bio': 'Biyografi',
  'profile.bio_save_failed': 'Biyografi kaydedilemedi.',
  'friends.people': 'kişi',
  'friends.search': 'Arkadaşlarında ara',
  'friends.mutual': 'ortak',
  'edit.title': 'Profili Düzenle',
  'edit.first_name': 'Ad',
  'edit.last_name': 'Soyad',
  'edit.username': 'Kullanıcı adı',
  'edit.email': 'E-posta',
  'edit.phone': 'Telefon',
  'edit.interests': 'İlgi alanları',
  'edit.interests_hint':
    'Favorilerini yaz. Boş bıraktıkların kaydedilmez; mevcut cevaplar güncellenir.',
  'edit.answer_placeholder': '{name} cevabın...',
  'edit.save': 'Kaydet',
  'edit.saving': 'Kaydediliyor...',
  'edit.loading': 'Profil bilgileri yükleniyor...',
  'edit.profile': 'Profil',
  'edit.session_missing': 'Oturum bilgisi bulunamadı.',
  'edit.load_failed': 'Profil yüklenemedi.',
  'edit.interests_alert': 'İlgi alanları',
  'edit.min_one_interest': 'En az bir ilgi alanı cevabı gir.',
  'edit.save_failed': 'Kayıt başarısız.',
};

function localBaseFor(code: string): Record<string, string> {
  return code.toLowerCase().startsWith('tr')
    ? { ...FALLBACK_TRANSLATIONS, ...LOCAL_TRANSLATIONS_TR }
    : FALLBACK_TRANSLATIONS;
}

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
    const nextCode = response.LanguageCode || code;
    setTranslations({
      ...localBaseFor(nextCode),
      ...(response.Translations ?? {}),
    });
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
