import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
  Screen,
  Typography,
} from '../../components';
import { useAuth } from '../../navigation/AuthContext';
import { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const SOCIALS: { icon: IconName; label: string }[] = [
  { icon: 'globe', label: 'Google' },
  { icon: 'phone', label: 'Telefon' },
  { icon: 'mail', label: 'Apple' },
];

export function LoginScreen({ navigation }: Props) {
  const theme = useTheme();
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Screen padded>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <LinearGradient
              colors={theme.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.logo, theme.shadows.glow]}>
              <Icon name="heart" size={30} color={theme.colors.onPrimary} filled />
            </LinearGradient>
            <Typography variant="h1">Tekrar hoş geldin</Typography>
            <Typography variant="body" color="textMuted">
              Devam etmek için giriş yap
            </Typography>
          </View>

          <View style={styles.form}>
            <Input
              label="E-posta veya telefon"
              placeholder="ornek@mail.com"
              leftIcon="mail"
              autoCapitalize="none"
              keyboardType="email-address"
              value={identifier}
              onChangeText={setIdentifier}
            />
            <Input
              label="Şifre"
              placeholder="••••••••"
              leftIcon="lock"
              password
              value={password}
              onChangeText={setPassword}
            />
            <Pressable style={styles.forgot} hitSlop={8}>
              <Typography variant="callout" tint={theme.colors.primary}>
                Şifremi unuttum
              </Typography>
            </Pressable>

            <Button label="Giriş Yap" rightIcon="chevron-right" onPress={signIn} />
          </View>

          <Divider label="veya şununla devam et" spacing={24} />

          <View style={styles.socials}>
            {SOCIALS.map(s => (
              <Pressable
                key={s.label}
                onPress={signIn}
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
              Hesabın yok mu?{' '}
            </Typography>
            <Pressable hitSlop={8} onPress={() => navigation.navigate('Register')}>
              <Typography variant="bodyStrong" tint={theme.colors.primary}>
                Kayıt Ol
              </Typography>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingVertical: 24, gap: 8 },
  header: { alignItems: 'center', gap: 8, marginBottom: 28 },
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
