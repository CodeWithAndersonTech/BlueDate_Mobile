import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  AuthHero,
  AuthPrimaryButton,
  BirthDatePicker,
  Checkbox,
  Chip,
  ConfirmPasswordInput,
  EmailInput,
  FigmaButton,
  FirstNameInput,
  LanguageFlagButton,
  LastNameInput,
  PasswordInput,
  Screen,
  SheetModal,
  Typography,
  UsernameInput,
} from '../../components';
import { useLocale, userFacingError } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import {
  defaultBirthParts,
  formatBirthDateIso,
  isValidRegisterAge,
} from '../../utils/birthDate';
import { GENDER_OPTIONS, GenderValue, isValidGender } from '../../utils/gender';
import { isValidEmail } from '../../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const theme = useTheme();
  const { register } = useAuth();
  const { t, languages, languageCode, setLanguage } = useLocale();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [missingMessage, setMissingMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState<GenderValue | null>(null);
  const [birthParts, setBirthParts] = useState(() => defaultBirthParts(25));

  const lastNameRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const ageValid = isValidRegisterAge(birthParts);

  const update = (key: keyof typeof form) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const passwordMismatch = useMemo(
    () =>
      form.confirmPassword.length > 0 && form.password !== form.confirmPassword,
    [form.password, form.confirmPassword],
  );

  const usernameValid = form.username.trim().length >= 3;
  const emailValid = isValidEmail(form.email);

  const emailError = useMemo(() => {
    if (!submitted) {
      return undefined;
    }
    if (!form.email.trim()) {
      return t('auth.email_required');
    }
    if (!emailValid) {
      return t('auth.email_invalid');
    }
    return undefined;
  }, [emailValid, form.email, submitted, t]);

  const firstMissing = (): string | null => {
    if (!form.firstName.trim()) {
      return t('auth.first_name_required');
    }
    if (!form.lastName.trim()) {
      return t('auth.last_name_required');
    }
    if (!form.username.trim()) {
      return t('auth.username_required');
    }
    if (!usernameValid) {
      return t('auth.username_length');
    }
    if (!form.email.trim()) {
      return t('auth.email_required');
    }
    if (!emailValid) {
      return t('auth.email_invalid');
    }
    if (!ageValid) {
      return t('auth.birth_date_required');
    }
    if (!isValidGender(gender)) {
      return t('auth.gender_required');
    }
    if (!form.password) {
      return t('auth.password_min');
    }
    if (form.password.length < 8) {
      return t('auth.password_min');
    }
    if (!form.confirmPassword) {
      return t('auth.confirm_required');
    }
    if (form.password !== form.confirmPassword) {
      return t('auth.password_mismatch');
    }
    if (!accepted) {
      return t('auth.terms_required');
    }
    return null;
  };

  const onRegister = async () => {
    setSubmitted(true);
    const missing = firstMissing();
    if (missing) {
      setMissingMessage(missing);
      return;
    }
    if (loading || !isValidGender(gender) || !ageValid) {
      return;
    }

    try {
      setLoading(true);
      const result = await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        gender,
        birthDate: formatBirthDateIso(birthParts),
      });

      navigation.navigate('EmailVerification', {
        email: result.email,
        password: result.password,
        userId: result.userId,
        purpose: 'register',
      });
    } catch (error) {
      Alert.alert(t('auth.register'), userFacingError(error, t, 'auth.register'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padded={false} edges={['top']}>
      <View pointerEvents="box-none" style={styles.flagAnchor}>
        <LanguageFlagButton
          languages={languages}
          selectedCode={languageCode}
          onSelect={code => {
            setLanguage(code).catch(() => undefined);
          }}
        />
      </View>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets>
        <AuthHero
          line1={t('auth.hero_register_line1')}
          line2={t('auth.hero_register_line2')}
          accent={t('auth.hero_register_accent')}
          subtitle={t('auth.hero_register_sub')}
        />

        <View style={styles.form}>
          <EmailInput
            ref={emailRef}
            pill
            label=""
            placeholder={t('auth.email')}
            value={form.email}
            onChangeText={text => update('email')(text.trim())}
            onSubmitEditing={() => passwordRef.current?.focus()}
            error={emailError}
          />
          <PasswordInput
            ref={passwordRef}
            pill
            label=""
            placeholder={t('auth.password')}
            value={form.password}
            onChangeText={update('password')}
            onSubmitEditing={() => confirmRef.current?.focus()}
            error={
              submitted && form.password.length > 0 && form.password.length < 8
                ? t('auth.password_min')
                : undefined
            }
          />
          <ConfirmPasswordInput
            ref={confirmRef}
            pill
            label=""
            placeholder={t('auth.password')}
            value={form.confirmPassword}
            onChangeText={update('confirmPassword')}
            error={
              passwordMismatch
                ? t('auth.password_mismatch')
                : submitted && form.confirmPassword.length === 0
                ? t('auth.confirm_required')
                : undefined
            }
          />
          <Typography variant="caption" color="textMuted">
            {t('auth.password_rules')}
          </Typography>

          <View style={styles.nameRow}>
            <FirstNameInput
              pill
              label=""
              containerStyle={styles.nameField}
              value={form.firstName}
              onChangeText={update('firstName')}
              onSubmitEditing={() => lastNameRef.current?.focus()}
              error={
                submitted && !form.firstName.trim()
                  ? t('auth.first_name_required')
                  : undefined
              }
            />
            <LastNameInput
              ref={lastNameRef}
              pill
              label=""
              containerStyle={styles.nameField}
              value={form.lastName}
              onChangeText={update('lastName')}
              onSubmitEditing={() => usernameRef.current?.focus()}
              error={
                submitted && !form.lastName.trim()
                  ? t('auth.last_name_required')
                  : undefined
              }
            />
          </View>

          <UsernameInput
            ref={usernameRef}
            pill
            label=""
            value={form.username}
            onChangeText={text =>
              update('username')(text.replace(/\s/g, '').toLowerCase())
            }
            error={
              submitted && !usernameValid
                ? t('auth.username_required')
                : undefined
            }
          />

          <BirthDatePicker
            label={t('auth.birth_date')}
            value={birthParts}
            onChange={setBirthParts}
            hint={t('auth.birth_date_hint')}
            error={
              submitted && !ageValid ? t('auth.birth_date_required') : undefined
            }
          />

          <View style={styles.genderBlock}>
            <Typography variant="caption" color="textSecondary">
              {t('auth.gender')}
            </Typography>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map(option => (
                <Chip
                  key={option.value}
                  label={t(option.labelKey)}
                  selected={gender === option.value}
                  onPress={() => setGender(option.value)}
                  style={styles.genderChip}
                />
              ))}
            </View>
            {submitted && !isValidGender(gender) && (
              <Typography variant="caption" color="danger">
                {t('auth.gender_required')}
              </Typography>
            )}
          </View>

          <Pressable style={styles.terms} onPress={() => setAccepted(a => !a)}>
            <Checkbox checked={accepted} onChange={setAccepted} />
            <Typography
              variant="caption"
              color="textSecondary"
              style={styles.termsText}>
              <Typography variant="caption" tint={theme.colors.plusCta}>
                {t('auth.terms_of_use')}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {' '}
                {t('auth.and')}{' '}
              </Typography>
              <Typography variant="caption" tint={theme.colors.plusCta}>
                {t('auth.privacy_policy')}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {t('auth.terms_suffix_kvkk')}
              </Typography>
            </Typography>
          </Pressable>

          <AuthPrimaryButton
            label={t('auth.register')}
            loading={loading}
            onPress={onRegister}
          />
        </View>

        <View style={styles.footer}>
          <Typography variant="caption" weight="500" color="textMuted">
            {t('auth.already_have_account')}
          </Typography>
          <Pressable hitSlop={8} onPress={() => navigation.navigate('Login')}>
            <Typography variant="caption" weight="700" tint={theme.colors.plusCta}>
              {t('auth.login')}
            </Typography>
          </Pressable>
        </View>
      </ScrollView>
      <SheetModal
        visible={Boolean(missingMessage)}
        title={t('auth.missing_title')}
        onClose={() => setMissingMessage(null)}>
        <Typography variant="callout" color="textMuted">
          {missingMessage}
        </Typography>
        <FigmaButton
          label={t('common.close')}
          tone="solid"
          size="md"
          fullWidth
          onPress={() => setMissingMessage(null)}
        />
      </SheetModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flagAnchor: {
    position: 'absolute',
    top: 8,
    right: 16,
    zIndex: 20,
    elevation: 20,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 10,
  },
  form: { gap: 10 },
  nameRow: { flexDirection: 'row', gap: 12 },
  nameField: { flex: 1 },
  genderBlock: { gap: 8 },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genderChip: { flexGrow: 1 },
  terms: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 4 },
  termsText: { flex: 1, lineHeight: 20 },
  cta: {
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    marginTop: 'auto',
  },
});

export default RegisterScreen;
