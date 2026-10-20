import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { resetPasswordWithOtp } from '../../api/auth';
import {
  Button,
  ConfirmPasswordInput,
  Header,
  PasswordInput,
  Screen,
  Typography,
} from '../../components';
import { useLocale, userFacingError } from '../../i18n';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const { t } = useLocale();
  const { email, code } = route.params;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const confirmRef = useRef<TextInput>(null);

  const mismatch = useMemo(
    () => confirmPassword.length > 0 && newPassword !== confirmPassword,
    [confirmPassword, newPassword],
  );

  const canSubmit =
    newPassword.length >= 8 && newPassword === confirmPassword && !!code;

  const onSubmit = async () => {
    setSubmitted(true);
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
      Alert.alert(t('auth.reset_title'), t('auth.password_changed'), [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      Alert.alert(
        t('auth.reset_title'),
        userFacingError(error, t, 'auth.password_change_failed'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <Header
        title={t('auth.reset_title')}
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={t('common.back')}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}>
        <Typography variant="body" color="textMuted" style={styles.hint}>
          {t('auth.reset_subtitle')}
        </Typography>

        <PasswordInput
          label={t('auth.new_password')}
          placeholder={t('auth.password_hint')}
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
          label={t('auth.confirm_password')}
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

        <Button
          label={loading ? t('auth.password_saving') : t('auth.reset_action')}
          leftIcon="check"
          onPress={() => {
            void onSubmit();
          }}
          disabled={loading}
          style={styles.submit}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
    paddingBottom: 32,
  },
  hint: { marginBottom: 4, lineHeight: 20 },
  submit: { marginTop: 8 },
});

export default ResetPasswordScreen;
