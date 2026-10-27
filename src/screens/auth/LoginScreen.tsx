import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AuthHero,
  AuthPrimaryButton,
  AuthSocialButton,
  Input,
  LanguageFlagButton,
  Screen,
  Typography,
} from '../../components';
import { useLocale, userFacingError } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { isValidLoginIdentifier } from '../../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const theme = useTheme();
  const { signIn } = useAuth();
  const { t, languages, languageCode, setLanguage } = useLocale();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const identifierError = useMemo(() => {
    if (!submitted) {
      return undefined;
    }
    if (!identifier.trim()) {
      return t('auth.email_required');
    }
    if (!isValidLoginIdentifier(identifier)) {
      return t('auth.identifier_invalid');
    }
    return undefined;
  }, [identifier, submitted, t]);

  const onLogin = async () => {
    setSubmitted(true);
    if (loading) {
      return;
    }
    if (!isValidLoginIdentifier(identifier) || !password) {
      return;
    }

    try {
      setLoading(true);
      await signIn({
        email: identifier.trim(),
        password,
      });
    } catch (error) {
      Alert.alert(
        t('auth.login'),
        userFacingError(error, t, 'auth.login_failed'),
      );
    } finally {
      setLoading(false);
    }
  };

  const socialSoon = () => {
    Alert.alert(t('auth.login'), t('auth.social_soon'));
  };

  return (
    <Screen padded={false} edges={['top']} style={styles.screen}>
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
          line1={t('auth.hero_login_line1')}
          line2={t('auth.hero_login_line2')}
          accent={t('auth.hero_login_accent')}
          subtitle={t('auth.hero_login_sub')}
        />

        <Input
          pill
          leftIcon="mail"
          placeholder={t('auth.email')}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={identifier}
          onChangeText={setIdentifier}
          error={identifierError}
        />
        <Input
          pill
          leftIcon="lock"
          password
          placeholder={t('auth.password')}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable
          style={styles.forgot}
          hitSlop={8}
          onPress={() => navigation.navigate('ForgotPassword')}>
          <Typography variant="caption" weight="500" tint={theme.colors.plusCta}>
            {t('auth.forgot_password')}
          </Typography>
        </Pressable>

        <AuthPrimaryButton
          label={t('auth.login')}
          loading={loading}
          onPress={onLogin}
        />

        <Typography variant="caption" weight="500" align="center">
          {t('auth.or')}
        </Typography>

        <AuthSocialButton
          provider="google"
          label={t('auth.google_sign_in')}
          onPress={socialSoon}
        />
        <AuthSocialButton
          provider="apple"
          label={t('auth.apple_sign_in')}
          onPress={socialSoon}
        />

        <View style={styles.footer}>
          <Typography variant="caption" weight="500" color="textMuted">
            {t('auth.no_account')}
          </Typography>
          <Pressable hitSlop={8} onPress={() => navigation.navigate('Register')}>
            <Typography variant="caption" weight="700" tint={theme.colors.plusCta}>
              {t('auth.register')}
            </Typography>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
    paddingBottom: 28,
    gap: 10,
  },
  forgot: { alignSelf: 'flex-end' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
  },
});

export default LoginScreen;
