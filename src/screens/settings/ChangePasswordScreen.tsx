import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { changePassword } from '../../api/auth';
import {
  Button,
  ConfirmPasswordInput,
  Header,
  PasswordInput,
  Screen,
  Typography,
} from '../../components';
import { useLocale } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { useLockTabSwipe } from '../../navigation/useLockTabSwipe';
import {
  HomeStackParamList,
  ProfileStackParamList,
} from '../../navigation/types';

type Props =
  | NativeStackScreenProps<ProfileStackParamList, 'ChangePassword'>
  | NativeStackScreenProps<HomeStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen({ navigation }: Props) {
  useLockTabSwipe();
  const { t } = useLocale();
  const { userId, accessToken } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const mismatch = useMemo(
    () => confirmPassword.length > 0 && newPassword !== confirmPassword,
    [confirmPassword, newPassword],
  );

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !!userId;

  const onSubmit = async () => {
    setSubmitted(true);
    if (!canSubmit || loading || !userId) {
      return;
    }

    try {
      setLoading(true);
      await changePassword(
        {
          UserId: userId,
          CurrentPassword: currentPassword,
          NewPassword: newPassword,
        },
        accessToken,
      );
      Alert.alert(t('settings.password'), t('auth.password_changed'), [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t('auth.password_change_failed');
      Alert.alert(t('settings.password'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <Header
        title={t('settings.password')}
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
          {t('auth.change_password_hint')}
        </Typography>

        <PasswordInput
          label={t('auth.current_password')}
          placeholder={t('auth.current_password_hint')}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          autoComplete="password"
          textContentType="password"
          returnKeyType="next"
          onSubmitEditing={() => newRef.current?.focus()}
          error={
            submitted && currentPassword.length === 0
              ? t('auth.current_password_required')
              : undefined
          }
        />

        <PasswordInput
          ref={newRef}
          label={t('auth.new_password')}
          placeholder={t('auth.password_hint')}
          value={newPassword}
          onChangeText={setNewPassword}
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          error={
            submitted && newPassword.length > 0 && newPassword.length < 8
              ? t('auth.password_min')
              : submitted && newPassword.length === 0
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
          label={loading ? t('auth.password_saving') : t('auth.change_password')}
          leftIcon="check"
          onPress={() => {
            void onSubmit();
          }}
          disabled={loading || !userId}
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

export default ChangePasswordScreen;
