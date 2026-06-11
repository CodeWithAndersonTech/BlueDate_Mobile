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
  Avatar,
  Button,
  Chip,
  Header,
  Icon,
  Input,
  Screen,
  SectionHeader,
  Typography,
} from '../../components';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { currentUser } from '../../utils';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

const ALL_INTERESTS = [
  'Oyun', 'Müzik', 'Seyahat', 'Fotoğraf', 'Kahve', 'Spor',
  'Sinema', 'Yemek', 'Sanat', 'Teknoloji', 'Doğa', 'Dans',
];

export function EditProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const [form, setForm] = useState({
    name: currentUser.name,
    username: currentUser.username.replace('@', ''),
    bio: currentUser.bio,
    location: currentUser.location,
    phone: '+90 555 123 45 67',
    email: 'samet@bluedate.app',
  });
  const [interests, setInterests] = useState<string[]>(currentUser.interests);

  const update = (key: keyof typeof form) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const toggleInterest = (i: string) =>
    setInterests(prev => (prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]));

  return (
    <Screen edges={['top']}>
      <Header
        onBack={() => navigation.goBack()}
        title="Profili Düzenle"
        actions={[{ icon: 'check', onPress: () => navigation.goBack() }]}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}>
          <View style={styles.photoWrap}>
            <Avatar uri={currentUser.avatar} name={currentUser.name} size="xxl" premium />
            <Pressable
              style={[styles.cameraBtn, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}>
              <Icon name="camera" size={18} color={theme.colors.onPrimary} />
            </Pressable>
            <Typography variant="caption" color="textMuted" style={styles.photoHint}>
              Profil fotoğrafını değiştir
            </Typography>
          </View>

          <View style={styles.form}>
            <Input label="Ad Soyad" leftIcon="user" value={form.name} onChangeText={update('name')} />
            <Input
              label="Kullanıcı adı"
              leftIcon="sparkles"
              autoCapitalize="none"
              value={form.username}
              onChangeText={update('username')}
            />
            <Input
              label="Hakkında"
              leftIcon="edit"
              multiline
              value={form.bio}
              onChangeText={update('bio')}
              containerStyle={styles.bio}
            />
            <Input label="Konum" leftIcon="map-pin" value={form.location} onChangeText={update('location')} />
            <Input
              label="Telefon"
              leftIcon="phone"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={update('phone')}
            />
            <Input
              label="E-posta"
              leftIcon="mail"
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              onChangeText={update('email')}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader title="İlgi alanları" />
            <View style={styles.interests}>
              {ALL_INTERESTS.map(i => (
                <Chip
                  key={i}
                  label={i}
                  selected={interests.includes(i)}
                  onPress={() => toggleInterest(i)}
                />
              ))}
            </View>
          </View>

          <Button label="Değişiklikleri Kaydet" onPress={() => navigation.goBack()} style={styles.save} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 24 },
  photoWrap: { alignItems: 'center', marginTop: 8 },
  cameraBtn: {
    position: 'absolute',
    bottom: 24,
    right: '34%',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: { marginTop: 10 },
  form: { gap: 16 },
  bio: { minHeight: 54 },
  section: { gap: 14 },
  interests: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  save: { marginTop: 8 },
});

export default EditProfileScreen;
