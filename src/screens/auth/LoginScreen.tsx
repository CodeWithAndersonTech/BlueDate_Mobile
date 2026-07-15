import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Button,
  Divider,
  Icon,
  IconName,
  Input,
  LanguageFlagButton,
  Screen,
  Typography,
} from '../../components';
import { useLocale } from '../../i18n';
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

  const socials = useMemo(
    () =>
      [
        { icon: 'globe' as IconName, label: t('common.google') },
        { icon: 'phone' as IconName, label: t('common.phone') },
        { icon: 'mail' as IconName, label: t('common.apple') },
      ] as const,
    [t],
  );

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
        error instanceof Error ? error.message : 'Login failed',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padded edges={['top']} style={styles.screen}>
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
        <View style={styles.header}>
          <LinearGradient
            colors={theme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.logo, theme.shadows.glow]}>
            <Icon name="heart" size={30} color={theme.colors.onPrimary} filled />
          </LinearGradient>
          <Typography variant="h1">{t('auth.login_title')}</Typography>
          <Typography variant="body" color="textMuted">
            {t('auth.login_subtitle')}
          </Typography>
        </View>

        <View style={styles.form}>
          <Input
            label={t('auth.email_or_phone')}
            placeholder={t('auth.email_placeholder')}
            leftIcon="mail"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={identifier}
            onChangeText={setIdentifier}
            error={identifierError}
          />
          <Input
            label={t('auth.password')}
            placeholder="••••••••"
            leftIcon="lock"
            password
            value={password}
            onChangeText={setPassword}
          />
          <Pressable style={styles.forgot} hitSlop={8}>
            <Typography variant="callout" tint={theme.colors.primary}>
              {t('auth.forgot_password')}
            </Typography>
          </Pressable>

          <Button
            label={t('auth.login')}
            rightIcon="chevron-right"
            loading={loading}
            onPress={onLogin}
          />
        </View>

        <Divider label={t('auth.or_continue')} spacing={24} />

        <View style={styles.socials}>
          {socials.map(s => (
            <Pressable
              key={s.label}
              onPress={onLogin}
              style={[
                styles.social,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radii.lg,
                },
              ]}>
              <Icon name={s.icon} size={22} color={theme.colors.text} />
              <Typography variant="caption" color="textMuted">
                {s.label}
              </Typography>
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <Typography variant="body" color="textMuted">
            {t('auth.no_account')}{' '}
          </Typography>
          <Pressable hitSlop={8} onPress={() => navigation.navigate('Register')}>
            <Typography variant="bodyStrong" tint={theme.colors.primary}>
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
  content: { flexGrow: 1, paddingTop: 12, paddingBottom: 24, gap: 16 },
  header: { alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 28 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  form: { gap: 16 },
  forgot: { alignSelf: 'flex-end', marginTop: -4 },
  socials: { flexDirection: 'row', gap: 12 },
  social: {
    flex: 1,
    height: 64,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: 24,
  },
});

export default LoginScreen;
