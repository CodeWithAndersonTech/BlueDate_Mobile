import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { resetPasswordWithOtp } from '../../api/auth';
import {
  AuthFlowBar,
  AuthFlowHero,
  AuthInlineError,
  AuthPrimaryButton,
  ConfirmPasswordInput,
  PasswordInput,
  Screen,
  Typography,
} from '../../components';
import { useLocale, userFacingError } from '../../i18n';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const { t, languages, languageCode, setLanguage } = useLocale();
  const { email, code } = route.params;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const confirmRef = useRef<TextInput>(null);

  const mismatch = useMemo(
    () => confirmPassword.length > 0 && newPassword !== confirmPassword,
    [confirmPassword, newPassword],
  );

  const canSubmit =
    newPassword.length >= 8 && newPassword === confirmPassword && !!code;

  const onSubmit = async () => {
    setSubmitted(true);
    setFormError(null);
    if (!canSubmit || loading) {
      return;
    }

    try {
      setLoading(true);
      await resetPasswordWithOtp({
        Email: email,
        Code: code,
        NewPassword: newPassword,
      });
      setDone(true);
    } catch (error) {
      setFormError(
        userFacingError(error, t, 'auth.password_change_failed'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padded={false} edges={['top']}>
      <AuthFlowBar
        title={t('auth.reset_nav')}
        onBack={() => (done ? navigation.navigate('Login') : navigation.goBack())}
        languages={languages}
        languageCode={languageCode}
        onSelectLanguage={lang => {
          setLanguage(lang).catch(() => undefined);
        }}
      />
      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}>
        {done ? (
          <View style={styles.form}>
            <AuthFlowHero
              glyph="tickCircle"
              title={t('auth.reset_success')}
              subtitle={t('auth.reset_success_sub')}
            />
            <AuthPrimaryButton
              label={t('auth.login')}
              onPress={() => navigation.navigate('Login')}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <AuthFlowHero
              glyph="sms"
              title={t('auth.reset_create_title')}
              subtitle={t('auth.reset_create_sub')}
            />

            <PasswordInput
              pill
              label=""
              placeholder={t('auth.new_password')}
              value={newPassword}
              onChangeText={setNewPassword}
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              error={
                submitted && newPassword.length < 8
                  ? t('auth.password_min')
                  : undefined
              }
            />

            <ConfirmPasswordInput
              ref={confirmRef}
              pill
              label=""
              placeholder={t('auth.confirm_new_password')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onSubmitEditing={() => {
                void onSubmit();
              }}
              error={
                mismatch
                  ? t('auth.password_mismatch')
                  : submitted && confirmPassword.length === 0
                    ? t('auth.confirm_required')
                    : undefined
              }
            />

            <Typography variant="caption" color="textMuted">
              {t('auth.password_rules')}
            </Typography>

            {formError ? <AuthInlineError message={formError} /> : null}

            <AuthPrimaryButton
              label={t('auth.reset_action')}
              loading={loading}
              onPress={() => {
                void onSubmit();
              }}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 40,
  },
  form: { gap: 14 },
});

export default ResetPasswordScreen;
