import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Avatar,
  Button,
  Header,
  Input,
  Screen,
  SectionHeader,
  Typography,
} from '../../components';
import {
  getInterestTypes,
  getUserProfile,
  InterestTypeItem,
  saveUserInterest,
} from '../../api';
import { useAuth } from '../../navigation/AuthContext';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const { userId, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState<string | undefined>();
  const [interestTypes, setInterestTypes] = useState<InterestTypeItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const fullName = `${firstName} ${lastName}`.trim();

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      Alert.alert('Profil', 'Oturum bilgisi bulunamadı.');
      return;
    }

    setLoading(true);
    try {
      const [profile, typesResponse] = await Promise.all([
        getUserProfile(userId, accessToken),
        getInterestTypes(accessToken),
      ]);

      setFirstName(profile.FirstName ?? '');
      setLastName(profile.LastName ?? '');
      setUsername(profile.Username ?? '');
      setEmail(profile.Email ?? '');
      setPhone(profile.Phone?.trim() ?? '');
      setProfileImage(profile.ProfileImage ?? undefined);

      const types = [...(typesResponse.GetAllInterestTypeQueryCommonObject ?? [])].sort(
        (a, b) => a.SortOrder - b.SortOrder,
      );
      setInterestTypes(types);

      const nextAnswers: Record<number, string> = {};
      types.forEach(type => {
        const existing = profile.Interests?.find(
          item => Number(item.InterestTypeId) === Number(type.Id),
        );
        nextAnswers[type.Id] = existing?.Value?.trim() ?? '';
      });
      setAnswers(nextAnswers);
    } catch (err) {
      Alert.alert(
        'Profil',
        err instanceof Error ? err.message : 'Profil yüklenemedi.',
      );
    } finally {
      setLoading(false);
    }
  }, [userId, accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const onSave = async () => {
    if (!userId) {
      Alert.alert('Profil', 'Oturum bilgisi bulunamadı.');
      return;
    }

    const filled = interestTypes
      .map(type => ({
        type,
        value: (answers[type.Id] ?? '').trim(),
      }))
      .filter(item => item.value.length > 0);

    if (filled.length === 0) {
      Alert.alert('İlgi alanları', 'En az bir ilgi alanı cevabı gir.');
      return;
    }

    setSaving(true);
    try {
      await Promise.all(
        filled.map(item =>
          saveUserInterest(
            {
              UserId: userId,
              InterestTypeId: item.type.Id,
              Value: item.value,
            },
            accessToken,
          ),
        ),
      );
      navigation.goBack();
    } catch (err) {
      Alert.alert(
        'İlgi alanları',
        err instanceof Error ? err.message : 'Kayıt başarısız.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <Header
        onBack={() => navigation.goBack()}
        title="Profili Düzenle"
        actions={[
          {
            icon: 'check',
            onPress: () => {
              if (!saving) {
                onSave();
              }
            },
          },
        ]}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}>
            <View style={styles.photoWrap}>
              <Avatar
                uri={profileImage}
                name={fullName || username}
                size="xxl"
              />
              <Typography variant="caption" color="textMuted" style={styles.photoHint}>
                {fullName || username}
              </Typography>
            </View>

            <View style={styles.form}>
              <Input label="Ad" leftIcon="user" value={firstName} editable={false} />
              <Input label="Soyad" leftIcon="user" value={lastName} editable={false} />
              <Input
                label="Kullanıcı adı"
                leftIcon="sparkles"
                value={username ? `@${username.replace(/^@/, '')}` : ''}
                editable={false}
              />
              <Input
                label="E-posta"
                leftIcon="mail"
                value={email}
                editable={false}
                autoCapitalize="none"
              />
              {phone.length > 0 && (
                <Input
                  label="Telefon"
                  leftIcon="phone"
                  value={phone}
                  editable={false}
                  keyboardType="phone-pad"
                />
              )}
            </View>

            <View style={styles.section}>
              <SectionHeader title="İlgi alanları" />
              <Typography variant="caption" color="textMuted">
                Favorilerini yaz. Boş bıraktıkların kaydedilmez; mevcut cevaplar güncellenir.
              </Typography>
              <View style={styles.interestFields}>
                {interestTypes.map(type => (
                  <Input
                    key={type.Id}
                    label={type.Name || type.Code}
                    placeholder={`${type.Name || type.Code} cevabın...`}
                    value={answers[type.Id] ?? ''}
                    onChangeText={text =>
                      setAnswers(prev => ({ ...prev, [type.Id]: text }))
                    }
                  />
                ))}
              </View>
            </View>

            <Button
              label={saving ? 'Kaydediliyor...' : 'Kaydet'}
              loading={saving}
              onPress={onSave}
              style={styles.save}
            />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 24 },
  photoWrap: { alignItems: 'center', marginTop: 8, gap: 8 },
  photoHint: { marginTop: 2 },
  form: { gap: 14 },
  section: { gap: 12 },
  interestFields: { gap: 14, marginTop: 4 },
  save: { marginTop: 8 },
});

export default EditProfileScreen;
