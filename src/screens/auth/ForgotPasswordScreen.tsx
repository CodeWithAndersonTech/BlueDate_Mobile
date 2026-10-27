import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { sendEmailOtp } from '../../api/auth';
import {
  AuthFlowBar,
  AuthFlowHero,
  AuthInlineError,
  AuthPrimaryButton,
  EmailInput,
  Screen,
} from '../../components';
import { isAccountGoneError, useLocale, userFacingError } from '../../i18n';
import { AuthStackParamList } from '../../navigation/types';
import { isValidEmail } from '../../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { t, languages, languageCode, setLanguage } = useLocale();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const emailValid = isValidEmail(email);

  const emailError = useMemo(() => {
    if (!submitted) {
      return undefined;
    }
    if (!email.trim()) {
      return t('auth.email_required');
    }
    if (!emailValid) {
      return t('auth.email_invalid');
    }
    return undefined;
  }, [email, emailValid, submitted, t]);

  const onSubmit = async () => {
    setSubmitted(true);
    setFormError(null);
    if (!emailValid || loading) {
      return;
    }

    try {
      setLoading(true);
      await sendEmailOtp({ Email: email.trim(), Purpose: 'reset' });
      navigation.navigate('EmailVerification', {
        email: email.trim(),
        purpose: 'reset',
      });
    } catch (error) {
      setFormError(
        isAccountGoneError(error)
          ? t('auth.forgot_not_found')
          : userFacingError(error, t),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padded={false} edges={['top']}>
      <AuthFlowBar
        title={t('auth.reset_nav')}
        onBack={() => navigation.goBack()}
        languages={languages}
        languageCode={languageCode}
        onSelectLanguage={code => {
          setLanguage(code).catch(() => undefined);
        }}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets>
        <AuthFlowHero
          glyph="lock"
          title={t('auth.forgot_title')}
          subtitle={t('auth.forgot_subtitle')}
        />

        <EmailInput
          pill
          label=""
          placeholder={t('auth.email')}
          value={email}
          onChangeText={text => {
            setEmail(text.trim());
            setFormError(null);
          }}
          onSubmitEditing={() => {
            void onSubmit();
          }}
          returnKeyType="send"
          blurOnSubmit
          error={emailError}
        />
        {formError ? <AuthInlineError message={formError} /> : null}

        <AuthPrimaryButton
          label={t('auth.forgot_send')}
          loading={loading}
          onPress={() => {
            void onSubmit();
          }}
        />
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
    gap: 14,
  },
});

export default ForgotPasswordScreen;
