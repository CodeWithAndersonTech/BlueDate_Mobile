import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
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
  Loading,
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
import { useLocale } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { ProfileStackParamList } from '../../navigation/types';
import { TAB_BAR_SPACE } from '../../utils';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
  const { userId, accessToken } = useAuth();
  const { t } = useLocale();
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
      Alert.alert(t('edit.profile'), t('edit.session_missing'));
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
        t('edit.profile'),
        err instanceof Error ? err.message : t('edit.load_failed'),
      );
    } finally {
      setLoading(false);
    }
  }, [userId, accessToken, t]);

  useEffect(() => {
    load();
  }, [load]);

  const onSave = async () => {
    if (!userId) {
      Alert.alert(t('edit.profile'), t('edit.session_missing'));
      return;
    }

    const filled = interestTypes
      .map(type => ({
        type,
        value: (answers[type.Id] ?? '').trim(),
      }))
      .filter(item => item.value.length > 0);

    if (filled.length === 0) {
      Alert.alert(t('edit.interests_alert'), t('edit.min_one_interest'));
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
        t('edit.interests_alert'),
        err instanceof Error ? err.message : t('edit.save_failed'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <Header
        onBack={() => navigation.goBack()}
        title={t('edit.title')}
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
          <Loading message={t('edit.loading')} />
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
              <Input label={t('edit.first_name')} leftIcon="user" value={firstName} editable={false} />
              <Input label={t('edit.last_name')} leftIcon="user" value={lastName} editable={false} />
              <Input
                label={t('edit.username')}
                leftIcon="sparkles"
                value={username ? `@${username.replace(/^@/, '')}` : ''}
                editable={false}
              />
              <Input
                label={t('edit.email')}
                leftIcon="mail"
                value={email}
                editable={false}
                autoCapitalize="none"
              />
              {phone.length > 0 && (
                <Input
                  label={t('edit.phone')}
                  leftIcon="phone"
                  value={phone}
                  editable={false}
                  keyboardType="phone-pad"
                />
              )}
            </View>

            <View style={styles.section}>
              <SectionHeader title={t('edit.interests')} />
              <Typography variant="caption" color="textMuted">
                {t('edit.interests_hint')}
              </Typography>
              <View style={styles.interestFields}>
                {interestTypes.map(type => (
                  <Input
                    key={type.Id}
                    label={type.Name || type.Code}
                    placeholder={t('edit.answer_placeholder').replace(
                      '{name}',
                      type.Name || type.Code,
                    )}
                    value={answers[type.Id] ?? ''}
                    onChangeText={text =>
                      setAnswers(prev => ({ ...prev, [type.Id]: text }))
                    }
                  />
                ))}
              </View>
            </View>

            <Button
              label={saving ? t('edit.saving') : t('edit.save')}
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
  content: { paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACE, gap: 24 },
  photoWrap: { alignItems: 'center', marginTop: 8, gap: 8 },
  photoHint: { marginTop: 2 },
  form: { gap: 14 },
  section: { gap: 12 },
  interestFields: { gap: 14, marginTop: 4 },
  save: { marginTop: 8 },
});

export default EditProfileScreen;
