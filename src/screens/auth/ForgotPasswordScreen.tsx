import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Button,
  EmailInput,
  Header,
  Icon,
  LanguageFlagButton,
  Screen,
  Typography,
} from '../../components';
import { useLocale } from '../../i18n';
import { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { isValidEmail } from '../../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t, languages, languageCode, setLanguage } = useLocale();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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
    if (!emailValid || loading) {
      return;
    }

    try {
      setLoading(true);
      // TODO(backend): call the password-reset endpoint here, e.g.
      //   await requestPasswordReset({ Email: email.trim() });
      // The screen is already language-independent; copy comes from the
      // backend translations via the i18n `t()` helper.
      await new Promise(resolve => setTimeout(resolve, 600));
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.headerWrap}>
          <Header
            onBack={() => navigation.goBack()}
            title={t('auth.forgot_password')}
          />
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
        <View style={styles.hero}>
          <LinearGradient
            colors={theme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.badge, theme.shadows.md]}>
            <Icon
              name={sent ? 'mail' : 'lock'}
              size={28}
              color={theme.colors.onPrimary}
            />
          </LinearGradient>
          <Typography variant="h1" align="center">
            {sent ? t('auth.forgot_sent_title') : t('auth.forgot_title')}
          </Typography>
          <Typography variant="body" color="textMuted" align="center">
            {sent ? t('auth.forgot_sent_desc') : t('auth.forgot_subtitle')}
          </Typography>
          {sent && (
            <Typography variant="bodyStrong" tint={theme.colors.primary} align="center">
              {email.trim()}
            </Typography>
          )}
        </View>

        {sent ? (
          <View style={styles.form}>
            <Button
              label={t('auth.forgot_back')}
              size="lg"
              onPress={() => navigation.navigate('Login')}
            />
            <Button
              label={t('auth.forgot_resend')}
              variant="ghost"
              onPress={() => {
                setSent(false);
                setSubmitted(false);
              }}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <EmailInput
              value={email}
              onChangeText={text => setEmail(text.trim())}
              onSubmitEditing={onSubmit}
              returnKeyType="send"
              blurOnSubmit
              error={emailError}
            />
            <Button
              label={t('auth.forgot_send')}
              size="lg"
              loading={loading}
              onPress={onSubmit}
            />
          </View>
        )}
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
    gap: 28,
  },
  hero: { alignItems: 'center', gap: 10, marginTop: 24 },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  form: { gap: 14 },
});

export default ForgotPasswordScreen;
