import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchFilterPrefs, saveFilterPrefs } from '../../api/filterPrefs';
import {
  Button,
  Card,
  Chip,
  Header,
  IconName,
  RangeSlider,
  Screen,
  SectionHeader,
  Typography,
} from '../../components';
import { useLocale } from '../../i18n';
import { useAuth } from '../../navigation/AuthContext';
import { useLockTabSwipe } from '../../navigation/useLockTabSwipe';
import {
  chipSelected,
  DEFAULT_FILTER_PREFS,
  FILTER_AGE_MAX,
  FILTER_AGE_MIN,
  FilterPrefs,
  loadLocalFilterPrefs,
  saveLocalFilterPrefs,
  toggleFilterChip,
} from '../../services/filters/filterPrefsStore';
import { useTheme } from '../../theme';
import { GenderValue } from '../../utils/gender';

type VisibilityOption = { key: string; labelKey: string; icon: IconName };

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  { key: 'women', labelKey: 'filter.option.women', icon: 'user' },
  { key: 'men', labelKey: 'filter.option.men', icon: 'user' },
  { key: 'lgbt', labelKey: 'filter.option.lgbt', icon: 'heart' },
  { key: 'everyone', labelKey: 'filter.option.everyone', icon: 'globe' },
];

export function FilterScreen() {
  useLockTabSwipe();
  const navigation = useNavigation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { userId, accessToken } = useAuth();

  const [age, setAge] = useState({
    low: DEFAULT_FILTER_PREFS.ageLow,
    high: DEFAULT_FILTER_PREFS.ageHigh,
  });
  const [showMe, setShowMe] = useState<GenderValue[]>([
    ...DEFAULT_FILTER_PREFS.showMe,
  ]);
  const [visibleTo, setVisibleTo] = useState<GenderValue[]>([
    ...DEFAULT_FILTER_PREFS.visibleTo,
  ]);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const applyPrefs = useCallback((prefs: FilterPrefs) => {
    setAge({ low: prefs.ageLow, high: prefs.ageHigh });
    setShowMe(prefs.showMe);
    setVisibleTo(prefs.visibleTo);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (!userId) {
        if (!cancelled) {
          applyPrefs(DEFAULT_FILTER_PREFS);
          setLoading(false);
        }
        return;
      }

      try {
        const local = await loadLocalFilterPrefs(userId);
        if (!cancelled) {
          applyPrefs(local);
          setLoading(false);
        }

        const remote = await fetchFilterPrefs(userId, accessToken);
        if (!cancelled) {
          applyPrefs(remote);
          await saveLocalFilterPrefs(userId, remote);
        }
      } catch {
        // Keep local/defaults if API is unreachable.
        if (!cancelled) {
          setLoading(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [userId, accessToken, applyPrefs]);

  const options = useMemo(
    () =>
      VISIBILITY_OPTIONS.map(o => ({
        ...o,
        label: t(o.labelKey),
      })),
    [t],
  );

  const currentPrefs = useCallback(
    (): FilterPrefs => ({
      ageLow: age.low,
      ageHigh: age.high,
      showMe,
      visibleTo,
    }),
    [age.high, age.low, showMe, visibleTo],
  );

  const toggle = (
    list: GenderValue[],
    setList: (next: GenderValue[]) => void,
    key: string,
  ) => {
    setList(toggleFilterChip(list, key));
  };

  const resetAll = () => {
    applyPrefs(DEFAULT_FILTER_PREFS);
  };

  const onApply = async () => {
    if (!userId || saving) {
      return;
    }

    const prefs = currentPrefs();
    try {
      setSaving(true);
      await saveLocalFilterPrefs(userId, prefs);
      await saveFilterPrefs(userId, prefs, accessToken);
      navigation.goBack();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('filter.save_failed');
      Alert.alert(t('filter.title'), message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <Header
        title={t('filter.title')}
        actions={[
          {
            icon: 'sliders',
            onPress: resetAll,
            accessibilityLabel: t('filter.reset'),
          },
        ]}
      />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.body}>
          <ScrollView
            scrollEnabled={scrollEnabled}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}>
            <View style={styles.section}>
              <SectionHeader title={t('filter.age_section')} />
              <Card variant="surface">
                <View style={styles.rowBetween}>
                  <Typography variant="bodyStrong">
                    {t('filter.age_label')}
                  </Typography>
                  <Typography variant="bodyStrong" tint={theme.colors.primary}>
                    {age.low} -{' '}
                    {age.high === FILTER_AGE_MAX
                      ? `${FILTER_AGE_MAX}+`
                      : age.high}
                  </Typography>
                </View>
                <Typography
                  variant="caption"
                  color="textMuted"
                  style={styles.hint}>
                  {t('filter.age_hint')}
                </Typography>
                <RangeSlider
                  min={FILTER_AGE_MIN}
                  max={FILTER_AGE_MAX}
                  low={age.low}
                  high={age.high}
                  onChange={(low, high) => setAge({ low, high })}
                  onSlidingStart={() => setScrollEnabled(false)}
                  onSlidingComplete={() => setScrollEnabled(true)}
                  style={styles.slider}
                />
                <View style={styles.rowBetween}>
                  <Typography variant="caption" color="textMuted">
                    {FILTER_AGE_MIN}
                  </Typography>
                  <Typography variant="caption" color="textMuted">
                    {FILTER_AGE_MAX}+
                  </Typography>
                </View>
              </Card>
            </View>

            <View style={styles.section}>
              <SectionHeader title={t('filter.show_me_section')} />
              <Card variant="surface">
                <Typography
                  variant="caption"
                  color="textMuted"
                  style={styles.hint}>
                  {t('filter.show_me_hint')}
                </Typography>
                <View style={styles.chips}>
                  {options.map(o => (
                    <Chip
                      key={o.key}
                      label={o.label}
                      icon={o.icon}
                      selected={chipSelected(showMe, o.key)}
                      onPress={() => toggle(showMe, setShowMe, o.key)}
                    />
                  ))}
                </View>
              </Card>
            </View>

            <View style={styles.section}>
              <SectionHeader title={t('filter.visible_to_section')} />
              <Card variant="surface">
                <Typography
                  variant="caption"
                  color="textMuted"
                  style={styles.hint}>
                  {t('filter.visible_to_hint')}
                </Typography>
                <View style={styles.chips}>
                  {options.map(o => (
                    <Chip
                      key={o.key}
                      label={o.label}
                      icon={o.icon}
                      selected={chipSelected(visibleTo, o.key)}
                      onPress={() => toggle(visibleTo, setVisibleTo, o.key)}
                    />
                  ))}
                </View>
              </Card>
            </View>
          </ScrollView>

          <View
            style={[
              styles.applyBar,
              {
                paddingBottom: Math.max(insets.bottom, 12),
                backgroundColor: theme.colors.background,
                borderTopColor: theme.colors.border,
              },
            ]}>
            <Button
              label={saving ? t('filter.saving') : t('filter.apply')}
              leftIcon="check"
              onPress={onApply}
              disabled={saving || !userId}
            />
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    gap: 18,
    paddingTop: 8,
    paddingBottom: 16,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: 12 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hint: { marginTop: 6, marginBottom: 4, lineHeight: 18 },
  slider: { marginTop: 18, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  applyBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

export default FilterScreen;
