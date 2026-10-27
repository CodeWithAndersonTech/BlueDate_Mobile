import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { InterestTypeItem, resolveMediaUrl, saveUserInterest, updateUserBasics } from '../../api';
import {
  AuthPrimaryButton,
  BirthDatePicker,
  BottomActionDock,
  FigmaIcon,
  FigmaSpinner,
  Input,
  Screen,
  SheetModal,
  Typography,
} from '../../components';
import { interestTypeLabel, useLocale, userFacingError } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import {
  assetFromPickerResponse,
  pickPhotoFromLibrary,
} from '../../services/photos/pickImage';
import { pickAndSetAvatar } from '../../services/photos/photoStore';
import { loadProfileCompleteness } from '../../services/onboarding/profileCompleteness';
import { useTheme } from '../../theme';
import {
  BirthParts,
  defaultBirthParts,
  formatBirthDateIso,
  isValidRegisterAge,
} from '../../utils/birthDate';
import {
  GENDER_OPTIONS,
  GenderValue,
  isValidGender,
} from '../../utils/gender';
import { zodiacFromMonthDay } from '../../utils/zodiac';

type Props = {
  onCompleted: () => void;
};

function partsFromIso(iso?: string | null): BirthParts {
  if (!iso) {
    return defaultBirthParts(25);
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return defaultBirthParts(25);
  }
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

function splitFullName(value: string): { first: string; last: string } {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  const space = trimmed.indexOf(' ');
  if (space < 0) {
    return { first: trimmed, last: '' };
  }
  return {
    first: trimmed.slice(0, space),
    last: trimmed.slice(space + 1).trim(),
  };
}

export function OnboardingSetupScreen({ onCompleted }: Props) {
  const theme = useTheme();
  const { t, languageCode } = useLocale();
  const { userId, accessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [interestTypes, setInterestTypes] = useState<InterestTypeItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthParts, setBirthParts] = useState(() => defaultBirthParts(25));
  const [gender, setGender] = useState<GenderValue | null>(null);
  const [sheetType, setSheetType] = useState<InterestTypeItem | null>(null);
  const [sheetValue, setSheetValue] = useState('');
  const [birthOpen, setBirthOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const hydrate = useCallback(async () => {
    if (!userId) {
      return;
    }
    setLoading(true);
    try {
      const data = await loadProfileCompleteness(userId, accessToken);
      setInterestTypes(data.interestTypes);
      setAnswers(data.answers);
      const resolved = data.avatarUri
        ? ((await resolveMediaUrl(data.avatarUri)) ?? data.avatarUri)
        : undefined;
      setAvatarUri(resolved);
      if (data.profile) {
        setUsername(data.profile.Username ?? '');
        setFullName(
          `${data.profile.FirstName ?? ''} ${data.profile.LastName ?? ''}`.trim(),
        );
        setBirthParts(partsFromIso(data.profile.BirthDate));
        setGender(
          isValidGender(data.profile.Gender) ? data.profile.Gender : null,
        );
      }
      if (data.isComplete) {
        onCompleted();
      }
    } catch {
      Alert.alert(t('onboarding.title'), t('onboarding.load_error'));
    } finally {
      setLoading(false);
    }
  }, [userId, accessToken, onCompleted, t]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const interestsComplete = useMemo(
    () =>
      interestTypes.length > 0 &&
      interestTypes.every(type => (answers[type.Id] ?? '').trim().length > 0),
    [answers, interestTypes],
  );
  const hasPhoto = Boolean(avatarUri);
  const { first, last } = splitFullName(fullName);
  const usernameValid = username.trim().length >= 3;
  const nameValid = first.length > 0 && last.length > 0;
  const ageValid = isValidRegisterAge(birthParts);
  const birthLabel = useMemo(() => {
    const locale =
      languageCode === 'tr'
        ? 'tr-TR'
        : languageCode === 'ar'
          ? 'ar'
          : languageCode === 'ru'
            ? 'ru-RU'
            : 'en-US';
    return new Date(
      birthParts.year,
      birthParts.month - 1,
      birthParts.day,
    ).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [birthParts, languageCode]);

  const zodiac = zodiacFromMonthDay(birthParts.month, birthParts.day);

  const openSheet = (type: InterestTypeItem) => {
    setSheetType(type);
    setSheetValue(answers[type.Id] ?? '');
  };

  const applySheet = () => {
    if (!sheetType) {
      return;
    }
    setAnswers(prev => ({
      ...prev,
      [sheetType.Id]: sheetValue.trim(),
    }));
    setSheetType(null);
  };

  const onPickPhoto = async () => {
    if (!userId || photoBusy) {
      return;
    }
    const result = await pickPhotoFromLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
    });
    if (result.didCancel) {
      return;
    }
    if (result.errorCode === 'permission') {
      Alert.alert(t('onboarding.photo_title'), t('profile.photo_permission'));
      return;
    }
    if (result.errorMessage === 'NATIVE_MODULE_MISSING') {
      Alert.alert(
        t('onboarding.photo_title'),
        t('profile.photo_native_missing'),
      );
      return;
    }
    const asset = assetFromPickerResponse(result);
    if (!asset) {
      Alert.alert(t('onboarding.photo_title'), t('profile.photo_error'));
      return;
    }
    setPhotoBusy(true);
    try {
      const uri = await pickAndSetAvatar(userId, asset, accessToken);
      setAvatarUri(uri);
    } catch {
      Alert.alert(t('onboarding.photo_title'), t('profile.photo_error'));
    } finally {
      setPhotoBusy(false);
    }
  };

  const firstMissing = (): string | null => {
    if (!hasPhoto) {
      return t('onboarding.photo_required');
    }
    if (!usernameValid) {
      return t('auth.username_length');
    }
    if (!nameValid) {
      return t('auth.last_name_required');
    }
    if (!ageValid) {
      return t('auth.birth_date_required');
    }
    if (!isValidGender(gender)) {
      return t('auth.gender_required');
    }
    if (!interestsComplete) {
      return t('onboarding.interests_required');
    }
    return null;
  };

  const onContinue = async () => {
    const missing = firstMissing();
    if (missing) {
      setFormError(missing);
      return;
    }
    if (!userId || !isValidGender(gender)) {
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await updateUserBasics(
        {
          UserId: userId,
          FirstName: first,
          LastName: last,
          Username: username.trim().toLowerCase(),
          BirthDate: `${formatBirthDateIso(birthParts)}T00:00:00.000Z`,
          Gender: gender,
        },
        accessToken,
      );
      await Promise.all(
        interestTypes.map(type => {
          const value = (answers[type.Id] ?? '').trim();
          return saveUserInterest(
            {
              UserId: userId,
              InterestTypeId: type.Id,
              Value: value,
            },
            accessToken,
          );
        }),
      );
      onCompleted();
    } catch (error) {
      Alert.alert(
        t('onboarding.title'),
        userFacingError(error, t, 'onboarding.save_error'),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen edges={['top']}>
        <View style={styles.center}>
          <FigmaSpinner color={theme.colors.plusCta} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.titles}>
            <Typography variant="h1" align="center" weight="600">
              {t('onboarding.hero_line1')}{' '}
              <Typography variant="h1" weight="600" tint={theme.colors.plusCta}>
                {t('onboarding.hero_accent')}
              </Typography>
            </Typography>
            <Typography variant="callout" align="center" color="textMuted">
              {t('onboarding.hero_sub')}
            </Typography>
          </View>

          <Pressable
            onPress={() => {
              void onPickPhoto();
            }}
            disabled={photoBusy}
            style={styles.photoBlock}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.colors.plusSoft },
              ]}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : (
                <FigmaIcon
                  name="profileAdd"
                  size={36}
                  color={theme.colors.plusCta}
                />
              )}
            </View>
            <Typography variant="caption" align="center" color="textMuted">
              {photoBusy
                ? t('onboarding.photo_uploading')
                : t('onboarding.photo_add')}
            </Typography>
          </Pressable>

          <View style={styles.field}>
            <Typography variant="caption" color="textMuted">
              {t('auth.username')}
            </Typography>
            <Input
              pill
              leftIcon="user"
              placeholder={t('auth.username')}
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={text =>
                setUsername(text.replace(/\s/g, '').toLowerCase())
              }
            />
          </View>

          <View style={styles.field}>
            <Typography variant="caption" color="textMuted">
              {t('onboarding.full_name')}
            </Typography>
            <Input
              pill
              leftIcon="user"
              placeholder={t('onboarding.full_name')}
              autoCapitalize="words"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.halfRow}>
            <View style={styles.half}>
              <Typography variant="caption" color="textMuted">
                {t('auth.birth_date')}
              </Typography>
              <Pressable
                onPress={() => setBirthOpen(true)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: theme.colors.authField,
                    borderColor: theme.colors.authFieldBorder,
                  },
                ]}>
                <FigmaIcon
                  name="sms"
                  size={18}
                  color={theme.colors.textMuted}
                />
                <Typography variant="caption" numberOfLines={1} style={styles.pillText}>
                  {birthLabel}
                </Typography>
                <Typography variant="callout">{zodiac.symbol}</Typography>
              </Pressable>
            </View>
            <View style={styles.half}>
              <Typography variant="caption" color="textMuted">
                {t('auth.gender')}
              </Typography>
              <Pressable
                onPress={() => setGenderOpen(true)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: theme.colors.authField,
                    borderColor: theme.colors.authFieldBorder,
                  },
                ]}>
                <FigmaIcon
                  name="people"
                  size={18}
                  color={theme.colors.textMuted}
                />
                <Typography variant="caption" numberOfLines={1} style={styles.pillText}>
                  {isValidGender(gender)
                    ? t(
                        GENDER_OPTIONS.find(o => o.value === gender)?.labelKey ??
                          'onboarding.gender_placeholder',
                      )
                    : t('onboarding.gender_placeholder')}
                </Typography>
                <FigmaIcon
                  name="arrowRight"
                  size={14}
                  color={theme.colors.textMuted}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.field}>
            <Typography variant="caption" color="textMuted">
              {t('onboarding.interests_title')}
            </Typography>
            <View style={styles.favList}>
              {interestTypes.map(type => {
                const value = (answers[type.Id] ?? '').trim();
                const filled = value.length > 0;
                return (
                  <Pressable
                    key={type.Id}
                    onPress={() => openSheet(type)}
                    style={[
                      styles.favRow,
                      {
                        backgroundColor: theme.colors.authField,
                        borderColor: theme.colors.authFieldBorder,
                      },
                    ]}>
                    <View
                      style={[
                        styles.favIcon,
                        { backgroundColor: theme.colors.plusSoft },
                      ]}>
                      <FigmaIcon
                        name="heart"
                        size={16}
                        color={theme.colors.plusCta}
                      />
                    </View>
                    <View style={styles.favCopy}>
                      <Typography variant="caption" color="textMuted">
                        {t('onboarding.favorite_prefix')}{' '}
                        {interestTypeLabel(t, type)}
                      </Typography>
                      <Typography variant="callout" weight="500">
                        {filled ? value : t('onboarding.not_selected')}
                      </Typography>
                    </View>
                    <Typography variant="caption" tint={theme.colors.plusCta}>
                      {filled
                        ? t('onboarding.change')
                        : t('edit.add_interest')}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {formError ? (
            <Typography variant="caption" tint={theme.colors.danger} align="center">
              {formError}
            </Typography>
          ) : null}
        </ScrollView>

        <BottomActionDock direction="column">
          <AuthPrimaryButton
            label={saving ? t('onboarding.saving') : t('onboarding.continue')}
            loading={saving}
            onPress={() => {
              void onContinue();
            }}
          />
        </BottomActionDock>
      </KeyboardAvoidingView>

      <SheetModal
        visible={sheetType != null}
        title={
          sheetType
            ? `${t('onboarding.favorite_prefix')} ${interestTypeLabel(t, sheetType)}`
            : undefined
        }
        onClose={() => setSheetType(null)}>
        <Input
          pill
          placeholder={t('edit.answer_placeholder').replace(
            '{name}',
            sheetType ? interestTypeLabel(t, sheetType) : '',
          )}
          value={sheetValue}
          onChangeText={setSheetValue}
          autoFocus
        />
        <AuthPrimaryButton
          label={t('edit.apply_interest')}
          onPress={applySheet}
        />
      </SheetModal>

      <SheetModal
        visible={birthOpen}
        title={t('auth.birth_date')}
        onClose={() => setBirthOpen(false)}>
        <BirthDatePicker value={birthParts} onChange={setBirthParts} />
        <AuthPrimaryButton
          label={t('edit.apply_interest')}
          onPress={() => setBirthOpen(false)}
        />
      </SheetModal>

      <SheetModal
        visible={genderOpen}
        title={t('auth.gender')}
        onClose={() => setGenderOpen(false)}>
        {GENDER_OPTIONS.map(option => (
          <Pressable
            key={option.value}
            onPress={() => {
              setGender(option.value);
              setGenderOpen(false);
            }}
            style={[
              styles.genderRow,
              {
                backgroundColor:
                  gender === option.value
                    ? theme.colors.plusSoft
                    : theme.colors.authField,
              },
            ]}>
            <Typography variant="callout" weight="500">
              {t(option.labelKey)}
            </Typography>
          </Pressable>
        ))}
      </SheetModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 14,
  },
  titles: { alignItems: 'center', gap: 4 },
  photoBlock: { alignItems: 'center', gap: 8 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 100, height: 100 },
  field: { gap: 6 },
  halfRow: { flexDirection: 'row', gap: 10 },
  half: { flex: 1, gap: 6 },
  pill: {
    height: 43,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillText: { flex: 1 },
  favList: { gap: 5 },
  favRow: {
    minHeight: 52,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  favIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favCopy: { flex: 1 },
  genderRow: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OnboardingSetupScreen;
