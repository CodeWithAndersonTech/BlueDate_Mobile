import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  InterestTypeItem,
  resolveMediaUrl,
  saveUserInterest,
} from '../../api';
import { Button, Screen, Typography } from '../../components';
import { useLocale } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import {
  assetFromPickerResponse,
  pickPhotoFromLibrary,
} from '../../services/photos/pickImage';
import { pickAndSetAvatar } from '../../services/photos/photoStore';
import { loadProfileCompleteness } from '../../services/onboarding/profileCompleteness';
import { useTheme } from '../../theme';

const INTEREST_EMOJI: { match: RegExp; emoji: string }[] = [
  { match: /food|yemek|yeme/i, emoji: '🍽' },
  { match: /dessert|tatlı|tatl/i, emoji: '🍰' },
  { match: /coffee|kahve/i, emoji: '☕' },
  { match: /drink|beverage|alcohol|alkol|içecek|icecek/i, emoji: '🥤' },
];

function interestEmoji(type: InterestTypeItem): string {
  const hay = `${type.Code ?? ''} ${type.Name ?? ''} ${type.KeyName ?? ''}`;
  for (const item of INTEREST_EMOJI) {
    if (item.match.test(hay)) return item.emoji;
  }
  return '✨';
}

type Props = {
  onCompleted: () => void;
};

export function OnboardingSetupScreen({ onCompleted }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { userId, accessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [interestTypes, setInterestTypes] = useState<InterestTypeItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const [sheetType, setSheetType] = useState<InterestTypeItem | null>(null);
  const [sheetValue, setSheetValue] = useState('');

  const hydrate = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await loadProfileCompleteness(userId, accessToken);
      setInterestTypes(data.interestTypes);
      setAnswers(data.answers);
      const resolved = data.avatarUri
        ? ((await resolveMediaUrl(data.avatarUri)) ?? data.avatarUri)
        : undefined;
      setAvatarUri(resolved);
      if (data.isComplete) {
        onCompleted();
      }
    } catch {
      Alert.alert(t('onboarding.title'), t('onboarding.load_error'));
    } finally {
      setLoading(false);
    }
  }, [userId, accessToken, onCompleted, t]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const interestsComplete = useMemo(
    () =>
      interestTypes.length > 0 &&
      interestTypes.every(type => (answers[type.Id] ?? '').trim().length > 0),
    [answers, interestTypes],
  );
  const hasPhoto = Boolean(avatarUri);
  const canContinue = interestsComplete && hasPhoto && !saving;

  const openSheet = (type: InterestTypeItem) => {
    setSheetType(type);
    setSheetValue(answers[type.Id] ?? '');
  };

  const applySheet = () => {
    if (!sheetType) return;
    setAnswers(prev => ({
      ...prev,
      [sheetType.Id]: sheetValue.trim(),
    }));
    setSheetType(null);
  };

  const onPickPhoto = async () => {
    if (!userId || photoBusy) return;
    const result = await pickPhotoFromLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
    });
    if (result.didCancel) return;
    if (result.errorCode === 'permission') {
      Alert.alert(t('onboarding.photo_title'), t('profile.photo_permission'));
      return;
    }
    if (result.errorMessage === 'NATIVE_MODULE_MISSING') {
      Alert.alert(
        t('onboarding.photo_title'),
        t('profile.photo_native_missing'),
      );
      return;
    }
    const asset = assetFromPickerResponse(result);
    if (!asset) {
      Alert.alert(t('onboarding.photo_title'), t('profile.photo_error'));
      return;
    }
    setPhotoBusy(true);
    try {
      const uri = await pickAndSetAvatar(userId, asset, accessToken);
      setAvatarUri(uri);
    } catch {
      Alert.alert(t('onboarding.photo_title'), t('profile.photo_error'));
    } finally {
      setPhotoBusy(false);
    }
  };

  const onContinue = async () => {
    if (!userId || !canContinue) return;
    setSaving(true);
    try {
      await Promise.all(
        interestTypes.map(type => {
          const value = (answers[type.Id] ?? '').trim();
          return saveUserInterest(
            {
              UserId: userId,
              InterestTypeId: type.Id,
              Value: value,
            },
            accessToken,
          );
        }),
      );
      onCompleted();
    } catch (error) {
      Alert.alert(
        t('onboarding.title'),
        error instanceof Error ? error.message : t('onboarding.save_error'),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) + 88 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Typography variant="h1">{t('onboarding.title')}</Typography>
          <Typography variant="body" color="textMuted" style={styles.lead}>
            {t('onboarding.subtitle')}
          </Typography>

          <View style={styles.section}>
            <Typography variant="title">{t('onboarding.interests_title')}</Typography>
            <Typography
              variant="caption"
              color="textMuted"
              style={styles.sectionHint}>
              {t('onboarding.interests_hint')}
            </Typography>
            <View style={styles.tiles}>
              {interestTypes.map(type => {
                const value = (answers[type.Id] ?? '').trim();
                const filled = value.length > 0;
                return (
                  <Pressable
                    key={type.Id}
                    onPress={() => openSheet(type)}
                    style={[
                      styles.tile,
                      {
                        backgroundColor: filled
                          ? theme.colors.primarySoft
                          : theme.colors.card,
                        borderColor: filled
                          ? theme.colors.primary
                          : theme.colors.border,
                      },
                    ]}>
                    <Text style={styles.tileEmoji}>{interestEmoji(type)}</Text>
                    <Typography variant="callout" weight="600" numberOfLines={2}>
                      {type.Name || type.Code}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={filled ? 'text' : 'textMuted'}
                      numberOfLines={2}>
                      {filled ? value : t('edit.add_interest')}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
            {!interestsComplete ? (
              <Typography variant="caption" color="danger">
                {t('onboarding.interests_required')}
              </Typography>
            ) : null}
          </View>

          <View style={styles.section}>
            <Typography variant="title">{t('onboarding.photo_title')}</Typography>
            <Typography
              variant="caption"
              color="textMuted"
              style={styles.sectionHint}>
              {t('onboarding.photo_hint')}
            </Typography>
            <Pressable
              onPress={() => {
                void onPickPhoto();
              }}
              disabled={photoBusy}
              style={[
                styles.photoCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: hasPhoto
                    ? theme.colors.success
                    : theme.colors.border,
                },
              ]}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.photo} />
              ) : (
                <View
                  style={[
                    styles.photoPlaceholder,
                    { backgroundColor: theme.colors.primarySoft },
                  ]}>
                  <Typography variant="h2" tint={theme.colors.primary}>
                    +
                  </Typography>
                  <Typography variant="caption" color="textMuted">
                    {photoBusy
                      ? t('onboarding.photo_uploading')
                      : t('onboarding.photo_add')}
                  </Typography>
                </View>
              )}
            </Pressable>
            {!hasPhoto ? (
              <Typography variant="caption" color="danger">
                {t('onboarding.photo_required')}
              </Typography>
            ) : null}
          </View>
        </ScrollView>

        <View
          style={[
            styles.dock,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
            },
          ]}>
          <Button
            label={saving ? t('onboarding.saving') : t('onboarding.continue')}
            onPress={() => {
              void onContinue();
            }}
            disabled={!canContinue}
            loading={saving}
          />
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={sheetType != null}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={() => setSheetType(null)}>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            style={[styles.backdrop, { backgroundColor: theme.colors.backdrop }]}
            onPress={() => setSheetType(null)}
          />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.card,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}>
            <Typography variant="h3">
              {sheetType?.Name || sheetType?.Code || ''}
            </Typography>
            <Typography variant="caption" color="textMuted">
              {t('onboarding.interests_hint')}
            </Typography>
            <TextInput
              value={sheetValue}
              onChangeText={setSheetValue}
              autoFocus
              placeholder={t('edit.answer_placeholder').replace(
                '{name}',
                sheetType?.Name || '',
              )}
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.sheetInput,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                },
              ]}
            />
            <View style={styles.sheetActions}>
              <Pressable
                onPress={() => setSheetType(null)}
                style={[styles.sheetBtn, styles.sheetGhost]}>
                <Text
                  style={[styles.sheetBtnLabel, { color: theme.colors.primary }]}>
                  {t('settings.cancel')}
                </Text>
              </Pressable>
              <Pressable
                onPress={applySheet}
                style={[
                  styles.sheetBtn,
                  { backgroundColor: theme.colors.primary },
                ]}>
                <Text
                  style={[
                    styles.sheetBtnLabel,
                    { color: theme.colors.onPrimary },
                  ]}>
                  {t('edit.apply_interest')}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 20,
  },
  lead: { marginTop: 6, lineHeight: 22 },
  section: { gap: 10 },
  sectionHint: { lineHeight: 18 },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '48%',
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    gap: 6,
  },
  tileEmoji: { fontSize: 22 },
  photoCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  photo: { width: 160, height: 160 },
  photoPlaceholder: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  sheetInput: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  sheetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetGhost: {},
  sheetBtnLabel: { fontSize: 15, fontWeight: '700' },
});

export default OnboardingSetupScreen;
