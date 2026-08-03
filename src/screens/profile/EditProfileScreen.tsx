import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  getInterestTypes,
  getUserProfile,
  InterestTypeItem,
  deleteUserInterest,
  saveUserInterest,
  updateUserBio,
} from '../../api';
import { useLocale } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { useLockTabSwipe } from '../../navigation/useLockTabSwipe';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';
import { EditProfileSkeleton } from './EditProfileSkeleton';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

type AccountRow = {
  key: string;
  label: string;
  value: string;
};

const TILE_WIDTH = '48%';
const TILE_HEIGHT = 100;
const SAVE_BTN_HEIGHT = 54;
const SAVED_FEEDBACK_MS = 850;
const BIO_MAX = 300;

const INTEREST_EMOJI: { match: RegExp; emoji: string }[] = [
  { match: /food|yemek|yeme/i, emoji: '🍽' },
  { match: /dessert|tatlı|tatl/i, emoji: '🍰' },
  { match: /coffee|kahve/i, emoji: '☕' },
  { match: /drink|beverage|alcohol|alkol|içecek|icecek/i, emoji: '🥤' },
  { match: /music|müzik|muzik/i, emoji: '🎵' },
  { match: /travel|gezi|seyahat/i, emoji: '✈' },
  { match: /fitness|sport|spor/i, emoji: '🏋' },
  { match: /game|oyun/i, emoji: '🎮' },
  { match: /book|kitap/i, emoji: '📚' },
  { match: /movie|film|sinema/i, emoji: '🎬' },
  { match: /art|sanat/i, emoji: '🎨' },
  { match: /nature|doğa|doga/i, emoji: '🌿' },
];

function interestEmoji(type: InterestTypeItem): string {
  const hay = `${type.Code ?? ''} ${type.Name ?? ''} ${type.KeyName ?? ''}`;
  for (const item of INTEREST_EMOJI) {
    if (item.match.test(hay)) return item.emoji;
  }
  return '✨';
}

export function EditProfileScreen({ navigation }: Props) {
  useLockTabSwipe();

  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { userId, accessToken } = useAuth();
  const { t } = useLocale();

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [initialBio, setInitialBio] = useState('');
  const [interestTypes, setInterestTypes] = useState<InterestTypeItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [initialAnswers, setInitialAnswers] = useState<Record<number, string>>(
    {},
  );
  /** InterestTypeId → mevcut UserInterest entity Id (silme için). */
  const [interestIds, setInterestIds] = useState<Record<number, number>>({});
  const [sheetType, setSheetType] = useState<InterestTypeItem | null>(null);
  const [sheetValue, setSheetValue] = useState('');
  const contentOpacity = useSharedValue(0);
  const hasLoadedRef = useRef(false);

  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  const filledCount = useMemo(
    () =>
      Object.values(answers).filter(value => value.trim().length > 0).length,
    [answers],
  );
  const progress =
    interestTypes.length > 0 ? filledCount / interestTypes.length : 0;

  const dirty = useMemo(() => {
    if (bio.trim() !== initialBio.trim()) return true;
    const keys = new Set([
      ...Object.keys(answers),
      ...Object.keys(initialAnswers),
    ]);
    for (const key of keys) {
      const id = Number(key);
      if ((answers[id] ?? '').trim() !== (initialAnswers[id] ?? '').trim()) {
        return true;
      }
    }
    return false;
  }, [answers, initialAnswers, bio, initialBio]);

  const accountRows = useMemo(() => {
    const rows: AccountRow[] = [
      { key: 'first', label: t('edit.first_name'), value: firstName || '—' },
      { key: 'last', label: t('edit.last_name'), value: lastName || '—' },
      {
        key: 'username',
        label: t('edit.username'),
        value: username ? `@${username.replace(/^@/, '')}` : '—',
      },
      { key: 'email', label: t('edit.email'), value: email || '—' },
    ];
    if (phone.trim()) {
      rows.push({ key: 'phone', label: t('edit.phone'), value: phone });
    }
    return rows;
  }, [t, firstName, lastName, username, email, phone]);

  const goBackToProfile = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('ProfileMain');
  }, [navigation]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBackToProfile();
      return true;
    });
    return () => sub.remove();
  }, [goBackToProfile]);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setLoadFailed(true);
      return;
    }
    const showSkeleton = !hasLoadedRef.current;
    if (showSkeleton) {
      setLoading(true);
    }
    setLoadFailed(false);
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
      const nextBio = profile.Bio?.trim() ?? '';
      setBio(nextBio);
      setInitialBio(nextBio);

      const types = [
        ...(typesResponse.GetAllInterestTypeQueryCommonObject ?? []),
      ].sort((a, b) => a.SortOrder - b.SortOrder);
      setInterestTypes(types);

      const nextAnswers: Record<number, string> = {};
      const nextIds: Record<number, number> = {};
      types.forEach(type => {
        const existing = profile.Interests?.find(
          item => Number(item.InterestTypeId) === Number(type.Id),
        );
        nextAnswers[type.Id] = existing?.Value?.trim() ?? '';
        if (existing?.Id != null) {
          nextIds[type.Id] = existing.Id;
        }
      });
      setAnswers(nextAnswers);
      setInitialAnswers({ ...nextAnswers });
      setInterestIds(nextIds);
      hasLoadedRef.current = true;
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [userId, accessToken]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (!loading && hasLoadedRef.current && !loadFailed) {
      contentOpacity.value = withTiming(1, {
        duration: 280,
        easing: Easing.out(Easing.quad),
      });
    } else if (loading) {
      contentOpacity.value = 0;
    }
  }, [loading, loadFailed, contentOpacity]);

  const contentFadeStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const openInterestSheet = (type: InterestTypeItem) => {
    setSheetType(type);
    setSheetValue(answers[type.Id] ?? '');
  };

  const applyInterestSheet = () => {
    if (!sheetType) return;
    setAnswers(prev => ({ ...prev, [sheetType.Id]: sheetValue.trim() }));
    setSheetType(null);
  };

  const clearInterestSheet = () => {
    if (!sheetType) return;
    setAnswers(prev => ({ ...prev, [sheetType.Id]: '' }));
    setSheetType(null);
  };

  const onSave = async () => {
    if (!userId) {
      Alert.alert(t('edit.profile'), t('edit.session_missing'));
      return;
    }
    if (!dirty) {
      return;
    }

    setSaving(true);
    try {
      const nextBio = bio.trim();
      const tasks: Promise<unknown>[] = [];
      const nextIds = { ...interestIds };

      if (nextBio !== initialBio.trim()) {
        tasks.push(
          updateUserBio({ UserId: userId, Bio: nextBio }, accessToken),
        );
      }

      for (const type of interestTypes) {
        const value = (answers[type.Id] ?? '').trim();
        const previous = (initialAnswers[type.Id] ?? '').trim();
        if (value === previous) {
          continue;
        }

        if (value.length > 0) {
          tasks.push(
            saveUserInterest(
              {
                UserId: userId,
                InterestTypeId: type.Id,
                Value: value,
              },
              accessToken,
            ).then(res => {
              if (res?.Id != null) {
                nextIds[type.Id] = res.Id;
              }
            }),
          );
        } else {
          const entityId = interestIds[type.Id];
          if (entityId != null) {
            tasks.push(
              deleteUserInterest(entityId, accessToken).then(() => {
                delete nextIds[type.Id];
              }),
            );
          }
        }
      }

      await Promise.all(tasks);
      setInitialBio(nextBio);
      setInitialAnswers({ ...answers });
      setInterestIds(nextIds);
      setSaving(false);
      setJustSaved(true);
      savedTimer.current = setTimeout(goBackToProfile, SAVED_FEEDBACK_MS);
    } catch {
      setSaving(false);
      Alert.alert(t('edit.save_error_title'), t('edit.save_error_desc'));
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <View style={styles.header}>
        <Text
          style={[styles.headerTitle, { color: theme.colors.text }]}
          numberOfLines={1}>
          {t('edit.title')}
        </Text>
      </View>

      {loading ? (
        <EditProfileSkeleton />
      ) : loadFailed ? (
        <View style={styles.center}>
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            {t('edit.load_error_title')}
          </Text>
          <Text style={[styles.muted, { color: theme.colors.textMuted }]}>
            {userId ? t('edit.load_error_desc') : t('edit.session_missing')}
          </Text>
          {userId ? (
            <Pressable
              onPress={load}
              style={[
                styles.retryBtn,
                { backgroundColor: theme.colors.primary },
              ]}>
              <Text
                style={[styles.retryLabel, { color: theme.colors.onPrimary }]}>
                {t('profile.retry')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Animated.View style={[styles.body, contentFadeStyle]}>
          <ScrollView
            style={styles.flex}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.content}>
            {/* Account */}
            <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
              {t('edit.account')}
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: theme.colors.card },
                theme.shadows.sm,
              ]}>
              {accountRows.map((row, index) => (
                <View key={row.key}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoText}>
                      <Text
                        style={[
                          styles.infoLabel,
                          { color: theme.colors.textMuted },
                        ]}>
                        {row.label}
                      </Text>
                      <Text
                        style={[
                          styles.infoValue,
                          { color: theme.colors.text },
                        ]}
                        numberOfLines={1}>
                        {row.value}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.lockGlyph,
                        { color: theme.colors.textMuted },
                      ]}>
                      🔒
                    </Text>
                  </View>
                  {index < accountRows.length - 1 ? (
                    <View
                      style={[
                        styles.sep,
                        { backgroundColor: theme.colors.border },
                      ]}
                    />
                  ) : null}
                </View>
              ))}
            </View>
            <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
              {t('edit.account_locked')}
            </Text>

            {/* Bio */}
            <Text
              style={[
                styles.sectionLabel,
                { color: theme.colors.textMuted, marginTop: 22 },
              ]}>
              {t('profile.bio')}
            </Text>
            <TextInput
              value={bio}
              onChangeText={text =>
                setBio(text.length <= BIO_MAX ? text : text.slice(0, BIO_MAX))
              }
              multiline
              placeholder={t('profile.add_bio_desc')}
              placeholderTextColor={theme.colors.textMuted}
              accessibilityLabel={t('profile.bio')}
              style={[
                styles.bioInput,
                {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            />
            <Text
              style={[styles.bioCounter, { color: theme.colors.textMuted }]}>
              {bio.trim().length}/{BIO_MAX}
            </Text>

            {/* Interests */}
            <View style={[styles.sectionHead, { marginTop: 18 }]}>
              <View style={styles.sectionHeadText}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: theme.colors.textMuted, marginBottom: 0 },
                  ]}>
                  {t('edit.interests')}
                </Text>
                <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
                  {t('edit.interests_hint')}
                </Text>
              </View>
              {interestTypes.length > 0 ? (
                <View
                  style={[
                    styles.progressPill,
                    { backgroundColor: theme.colors.primarySoft },
                  ]}>
                  <View
                    style={[
                      styles.progressTrack,
                      { backgroundColor: theme.colors.surfaceAlt },
                    ]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.round(progress * 100)}%` as `${number}%`,
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.progressCount,
                      { color: theme.colors.primary },
                    ]}>
                    {filledCount}/{interestTypes.length}
                  </Text>
                </View>
              ) : null}
            </View>

            {interestTypes.length === 0 ? (
              <Text style={[styles.muted, { color: theme.colors.textMuted }]}>
                {t('edit.no_interest_types')}
              </Text>
            ) : (
              <View style={styles.tileGrid}>
                {interestTypes.map(type => {
                  const value = (answers[type.Id] ?? '').trim();
                  const selected = value.length > 0;
                  return (
                    <InterestTile
                      key={type.Id}
                      emoji={interestEmoji(type)}
                      title={type.Name || type.Code}
                      value={value}
                      selected={selected}
                      addLabel={t('edit.add_interest')}
                      onPress={() => openInterestSheet(type)}
                    />
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Page-local save bar — lifted above home indicator */}
          <View
            style={[
              styles.saveBar,
              {
                paddingBottom: insets.bottom + 40,
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.border,
              },
            ]}>
            {justSaved ? (
              <View style={styles.savedRow}>
                <Text style={{ color: theme.colors.success, fontSize: 16 }}>
                  ✓
                </Text>
                <Text
                  style={[styles.savedLabel, { color: theme.colors.success }]}>
                  {t('edit.saved')}
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={onSave}
                disabled={!dirty || saving}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: !dirty || saving,
                  busy: saving,
                }}
                style={[
                  styles.saveBtn,
                  {
                    backgroundColor: dirty
                      ? theme.colors.primary
                      : theme.colors.primarySoft,
                    borderColor: theme.colors.primary,
                    opacity: saving ? 0.85 : 1,
                  },
                ]}>
                {saving ? (
                  <ActivityIndicator color={theme.colors.onPrimary} />
                ) : (
                  <Text
                    style={[
                      styles.saveLabel,
                      {
                        color: dirty
                          ? theme.colors.onPrimary
                          : theme.colors.primary,
                      },
                    ]}>
                    {t('edit.save_changes')}
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}

      <InterestSheet
        visible={sheetType != null}
        emoji={sheetType ? interestEmoji(sheetType) : '✨'}
        title={sheetType?.Name || sheetType?.Code || ''}
        value={sheetValue}
        onChange={setSheetValue}
        onClose={() => setSheetType(null)}
        onApply={applyInterestSheet}
        onClear={clearInterestSheet}
        hasValue={(answers[sheetType?.Id ?? -1] ?? '').trim().length > 0}
      />
    </SafeAreaView>
  );
}

function InterestTile({
  emoji,
  title,
  value,
  selected,
  onPress,
  addLabel,
}: {
  emoji: string;
  title: string;
  value: string;
  selected: boolean;
  onPress: () => void;
  addLabel: string;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 16, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 260 });
      }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}: ${selected ? value : addLabel}`}
      style={styles.tileWrap}>
      <Animated.View
        style={[
          styles.tile,
          {
            backgroundColor: selected
              ? theme.colors.primarySoft
              : theme.colors.card,
            borderColor: selected
              ? theme.colors.primary
              : theme.colors.border,
          },
          theme.shadows.sm,
          animated,
        ]}>
        <View style={styles.tileTop}>
          <View
            style={[
              styles.emojiBadge,
              {
                backgroundColor: selected
                  ? theme.colors.primary
                  : theme.colors.surfaceAlt,
              },
            ]}>
            <Text style={styles.emojiText}>{emoji}</Text>
          </View>
          {selected ? (
            <View
              style={[
                styles.checkDot,
                { backgroundColor: theme.colors.primary },
              ]}>
              <Text
                style={[styles.checkGlyph, { color: theme.colors.onPrimary }]}>
                ✓
              </Text>
            </View>
          ) : (
            <Text style={[styles.plusGlyph, { color: theme.colors.textMuted }]}>
              +
            </Text>
          )}
        </View>
        <Text
          style={[styles.tileTitle, { color: theme.colors.textMuted }]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {title}
        </Text>
        <Text
          style={[
            styles.tileValue,
            { color: selected ? theme.colors.text : theme.colors.textMuted },
          ]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {selected ? value : addLabel}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function InterestSheet({
  visible,
  emoji,
  title,
  value,
  onChange,
  onClose,
  onApply,
  onClear,
  hasValue,
}: {
  visible: boolean;
  emoji: string;
  title: string;
  value: string;
  onChange: (text: string) => void;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  hasValue: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const showClear = hasValue || value.trim().length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.colors.backdrop }]}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.card,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <View
            style={[
              styles.sheetHandle,
              { backgroundColor: theme.colors.borderStrong },
            ]}
          />
          <View style={styles.sheetHeader}>
            <View
              style={[
                styles.sheetEmoji,
                { backgroundColor: theme.colors.primarySoft },
              ]}>
              <Text style={styles.sheetEmojiText}>{emoji}</Text>
            </View>
            <View style={styles.sheetHeaderText}>
              <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
                {title}
              </Text>
              <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
                {t('edit.interest_sheet_hint')}
              </Text>
            </View>
          </View>
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={t('edit.answer_placeholder').replace('{name}', title)}
            placeholderTextColor={theme.colors.textMuted}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={onApply}
            accessibilityLabel={title}
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
            {showClear ? (
              <Pressable
                onPress={onClear}
                style={[styles.sheetBtn, styles.sheetGhost]}>
                <Text
                  style={[
                    styles.sheetBtnLabel,
                    { color: theme.colors.primary },
                  ]}>
                  {t('edit.clear_interest')}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.sheetBtn} />
            )}
            <Pressable
              onPress={onApply}
              style={[
                styles.sheetBtn,
                styles.sheetPrimary,
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
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  body: { flex: 1 },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 4,
    minHeight: 36,
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  muted: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryLabel: { fontSize: 15, fontWeight: '700' },
  content: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  infoText: { flex: 1, gap: 2 },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 15, fontWeight: '600' },
  lockGlyph: { fontSize: 12 },
  sep: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  hint: { fontSize: 12, lineHeight: 16, marginTop: 6 },
  bioInput: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  bioCounter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    marginTop: 6,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionHeadText: { flex: 1, gap: 2 },
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  progressTrack: {
    width: 36,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  progressCount: { fontSize: 12, fontWeight: '700' },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  tileWrap: { width: TILE_WIDTH, height: TILE_HEIGHT },
  tile: {
    flex: 1,
    height: TILE_HEIGHT,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  emojiBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 14 },
  checkDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkGlyph: { fontSize: 11, fontWeight: '700' },
  plusGlyph: { fontSize: 18, fontWeight: '500' },
  tileTitle: { fontSize: 11, lineHeight: 14, marginBottom: 2 },
  tileValue: { fontSize: 13, lineHeight: 16, fontWeight: '600' },
  saveBar: {
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    height: SAVE_BTN_HEIGHT,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: { fontSize: 16, fontWeight: '700' },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: SAVE_BTN_HEIGHT,
  },
  savedLabel: { fontSize: 16, fontWeight: '700' },
  backdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetEmoji: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetEmojiText: { fontSize: 24 },
  sheetHeaderText: { flex: 1, gap: 2 },
  sheetTitle: { fontSize: 17, fontWeight: '600' },
  sheetInput: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  sheetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  sheetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetGhost: {},
  sheetPrimary: {},
  sheetBtnLabel: { fontSize: 15, fontWeight: '700' },
});

export default EditProfileScreen;
