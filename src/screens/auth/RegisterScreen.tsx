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
import {
  Button,
  Checkbox,
  Header,
  Input,
  Screen,
  Typography,
} from '../../components';
import { useAuth } from '../../navigation/AuthContext';
import { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const theme = useTheme();
  const { signIn } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
  });
  const [accepted, setAccepted] = useState(false);

  const update = (key: keyof typeof form) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Screen>
      <Header onBack={() => navigation.goBack()} title="Kayıt Ol" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <Typography variant="h1">Hesap oluştur</Typography>
            <Typography variant="body" color="textMuted">
              Topluluğa katıl, yeni insanlarla tanış.
            </Typography>
          </View>

          <View style={styles.form}>
            <Input
              label="Ad Soyad"
              placeholder="Adın Soyadın"
              leftIcon="user"
              value={form.fullName}
              onChangeText={update('fullName')}
            />
            <Input
              label="Kullanıcı adı"
              placeholder="kullaniciadi"
              leftIcon="sparkles"
              autoCapitalize="none"
              value={form.username}
              onChangeText={update('username')}
            />
            <Input
              label="E-posta"
              placeholder="ornek@mail.com"
              leftIcon="mail"
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              onChangeText={update('email')}
            />
            <Input
              label="Telefon"
              placeholder="+90 5xx xxx xx xx"
              leftIcon="phone"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={update('phone')}
            />
            <Input
              label="Şifre"
              placeholder="En az 8 karakter"
              leftIcon="lock"
              password
              value={form.password}
              onChangeText={update('password')}
            />

            <Pressable style={styles.terms} onPress={() => setAccepted(a => !a)}>
              <Checkbox checked={accepted} onChange={setAccepted} />
              <Typography variant="caption" color="textSecondary" style={styles.termsText}>
                <Typography variant="caption" color="textSecondary">
                  Devam ederek{' '}
                </Typography>
                <Typography variant="caption" tint={theme.colors.primary}>
                  Kullanım Şartları
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {' '}ve{' '}
                </Typography>
                <Typography variant="caption" tint={theme.colors.primary}>
                  Gizlilik Politikası
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  ’nı kabul ediyorum.
                </Typography>
              </Typography>
            </Pressable>

            <Button
              label="Kayıt Ol"
              rightIcon="check"
              disabled={!accepted}
              onPress={signIn}
            />
          </View>

          <View style={styles.footer}>
            <Typography variant="body" color="textMuted">
              Zaten hesabın var mı?{' '}
            </Typography>
            <Pressable hitSlop={8} onPress={() => navigation.navigate('Login')}>
              <Typography variant="bodyStrong" tint={theme.colors.primary}>
                Giriş Yap
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
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 20 },
  intro: { gap: 6, marginTop: 8 },
  form: { gap: 16 },
  terms: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  termsText: { flex: 1, lineHeight: 20 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
});

export default RegisterScreen;
