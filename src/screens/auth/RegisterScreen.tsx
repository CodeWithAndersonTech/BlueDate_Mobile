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
  Button,
  Checkbox,
  Chip,
  ConfirmPasswordInput,
  EmailInput,
  FirstNameInput,
  Header,
  LanguageFlagButton,
  LastNameInput,
  PasswordInput,
  Screen,
  Typography,
  UsernameInput,
} from '../../components';
import { useLocale } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
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
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState<GenderValue | null>(null);

  const lastNameRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

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

  const canSubmit =
    accepted &&
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    usernameValid &&
    emailValid &&
    isValidGender(gender) &&
    form.password.length >= 8 &&
    form.password === form.confirmPassword;

  const onRegister = async () => {
    setSubmitted(true);
    if (!canSubmit || loading || !isValidGender(gender)) {
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
      });

      navigation.navigate('EmailVerification', {
        email: result.email,
        password: result.password,
        userId: result.userId,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('auth.register');
      Alert.alert(t('auth.register'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.headerWrap}>
          <Header onBack={() => navigation.goBack()} title={t('auth.register')} />
        </View>
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
        <View style={styles.intro}>
          <Typography variant="h1">{t('auth.register_title')}</Typography>
          <Typography variant="body" color="textMuted">
            {t('auth.register_subtitle')}
          </Typography>
        </View>

        <View style={styles.form}>
          <View style={styles.nameRow}>
            <FirstNameInput
              containerStyle={styles.nameField}
              value={form.firstName}
              onChangeText={update('firstName')}
              onSubmitEditing={() => lastNameRef.current?.focus()}
            />
            <LastNameInput
              ref={lastNameRef}
              containerStyle={styles.nameField}
              value={form.lastName}
              onChangeText={update('lastName')}
              onSubmitEditing={() => usernameRef.current?.focus()}
            />
          </View>

          <UsernameInput
            ref={usernameRef}
            value={form.username}
            onChangeText={text =>
              update('username')(text.replace(/\s/g, '').toLowerCase())
            }
            onSubmitEditing={() => emailRef.current?.focus()}
            error={
              submitted && !usernameValid
                ? t('auth.username_required')
                : undefined
            }
          />

          <EmailInput
            ref={emailRef}
            value={form.email}
            onChangeText={text => update('email')(text.trim())}
            onSubmitEditing={() => passwordRef.current?.focus()}
            error={emailError}
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

          <PasswordInput
            ref={passwordRef}
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
            value={form.confirmPassword}
            onChangeText={update('confirmPassword')}
            blurOnSubmit
            onSubmitEditing={onRegister}
            error={
              passwordMismatch
                ? t('auth.password_mismatch')
                : submitted && form.confirmPassword.length === 0
                ? t('auth.confirm_required')
                : undefined
            }
          />

          <Pressable style={styles.terms} onPress={() => setAccepted(a => !a)}>
            <Checkbox checked={accepted} onChange={setAccepted} />
            <Typography
              variant="caption"
              color="textSecondary"
              style={styles.termsText}>
              <Typography variant="caption" color="textSecondary">
                {t('auth.terms_prefix')}{' '}
              </Typography>
              <Typography variant="caption" tint={theme.colors.primary}>
                {t('auth.terms_of_use')}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {' '}
                {t('auth.and')}{' '}
              </Typography>
              <Typography variant="caption" tint={theme.colors.primary}>
                {t('auth.privacy_policy')}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {t('auth.terms_suffix')}
              </Typography>
            </Typography>
          </Pressable>

          <View style={styles.cta}>
            <Button
              label={t('auth.register')}
              size="lg"
              rightIcon="check"
              disabled={!accepted}
              loading={loading}
              onPress={onRegister}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Typography variant="body" color="textMuted">
            {t('auth.already_have_account')}{' '}
          </Typography>
          <Pressable hitSlop={8} onPress={() => navigation.navigate('Login')}>
            <Typography variant="bodyStrong" tint={theme.colors.primary}>
              {t('auth.login')}
            </Typography>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  headerWrap: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  intro: { gap: 6, marginTop: 8 },
  form: { gap: 14 },
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
