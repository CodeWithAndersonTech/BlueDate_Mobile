import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { fetchFilterPrefs, saveFilterPrefs } from '../../api/filterPrefs';
import {
  AuthPrimaryButton,
  BottomActionDock,
  FigmaIcon,
  FigmaSpinner,
  FigmaSvgName,
  Header,
  RangeSlider,
  Screen,
  Typography,
} from '../../components';
import { useLocale, userFacingError } from '../../i18n';
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

type FilterChip = {
  key: string;
  labelKey: string;
  icon?: FigmaSvgName;
};

const SHOW_ME_CHIPS: FilterChip[] = [
  { key: 'men', labelKey: 'filter.option.men', icon: 'man' },
  { key: 'lgbt', labelKey: 'filter.option.lgbt' },
  { key: 'everyone', labelKey: 'filter.option.everyone', icon: 'people' },
  { key: 'women', labelKey: 'filter.option.women', icon: 'woman' },
];

const VISIBLE_TO_CHIPS: FilterChip[] = [
  { key: 'men', labelKey: 'filter.option.men', icon: 'man' },
  { key: 'everyone', labelKey: 'filter.option.everyone', icon: 'people' },
  { key: 'lgbt', labelKey: 'filter.option.lgbt' },
  { key: 'women', labelKey: 'filter.option.women', icon: 'woman' },
];

export function FilterScreen() {
  useLockTabSwipe();
  const navigation = useNavigation();
  const theme = useTheme();
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

  const currentPrefs = useCallback(
    (): FilterPrefs => ({
      ageLow: age.low,
      ageHigh: age.high,
      showMe,
      visibleTo,
    }),
    [age.high, age.low, showMe, visibleTo],
  );

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
      Alert.alert(
        t('filter.title'),
        userFacingError(error, t, 'filter.save_failed'),
      );
    } finally {
      setSaving(false);
    }
  };

  const ageLabel =
    age.high === FILTER_AGE_MAX
      ? `${age.low}-${FILTER_AGE_MAX}+`
      : `${age.low}-${age.high}`;

  return (
    <Screen padded={false} edges={['top']}>
      <Header
        title={t('filter.title')}
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={t('common.back')}
      />
      {loading ? (
        <View style={styles.loading}>
          <FigmaSpinner color={theme.colors.plusCta} />
        </View>
      ) : (
        <View style={styles.body}>
          <ScrollView
            style={styles.flex}
            scrollEnabled={scrollEnabled}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}>
            <View style={styles.section}>
              <Typography variant="caption" color="textMuted">
                {t('filter.age_section')}
              </Typography>
              <View
                style={[
                  styles.ageCard,
                  {
                    backgroundColor: theme.colors.authField,
                    borderColor: theme.colors.authFieldBorder,
                  },
                ]}>
                <View style={styles.rowBetween}>
                  <Typography variant="callout" weight="500">
                    {t('filter.selected_range')}
                  </Typography>
                  <Typography variant="caption" color="textMuted">
                    {ageLabel}
                  </Typography>
                </View>
                <Typography variant="caption" color="textMuted">
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
                />
                <View style={styles.rowBetween}>
                  <Typography variant="caption" color="textMuted">
                    {FILTER_AGE_MIN}
                  </Typography>
                  <Typography variant="caption" color="textMuted">
                    +{FILTER_AGE_MAX}
                  </Typography>
                </View>
              </View>
            </View>

            <ChipBlock
              title={t('filter.show_me_section')}
              chips={SHOW_ME_CHIPS}
              selected={showMe}
              onToggle={key => setShowMe(toggleFilterChip(showMe, key))}
            />
            <ChipBlock
              title={t('filter.visible_to_section')}
              chips={VISIBLE_TO_CHIPS}
              selected={visibleTo}
              onToggle={key => setVisibleTo(toggleFilterChip(visibleTo, key))}
            />
          </ScrollView>

          <BottomActionDock forceAboveTabBar direction="column">
            <AuthPrimaryButton
              label={saving ? t('filter.saving') : t('filter.apply')}
              loading={saving}
              onPress={() => {
                void onApply();
              }}
            />
          </BottomActionDock>
        </View>
      )}
    </Screen>
  );
}

function ChipBlock({
  title,
  chips,
  selected,
  onToggle,
}: {
  title: string;
  chips: FilterChip[];
  selected: GenderValue[];
  onToggle: (key: string) => void;
}) {
  const { t } = useLocale();
  return (
    <View style={styles.section}>
      <Typography variant="caption" color="textMuted">
        {title}
      </Typography>
      <View style={styles.chips}>
        {chips.map(chip => (
          <FilterTag
            key={chip.key}
            icon={chip.icon}
            label={t(chip.labelKey)}
            selected={chipSelected(selected, chip.key)}
            onPress={() => onToggle(chip.key)}
          />
        ))}
      </View>
    </View>
  );
}

function FilterTag({
  icon,
  label,
  selected,
  onPress,
}: {
  icon?: FigmaSvgName;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.tag,
        {
          backgroundColor: selected
            ? theme.colors.plusSoft
            : theme.colors.authField,
          borderColor: selected
            ? theme.colors.plusCta
            : theme.colors.authFieldBorder,
        },
      ]}>
      {icon ? (
        <FigmaIcon
          name={icon}
          size={20}
          color={selected ? theme.colors.plusCta : theme.colors.text}
        />
      ) : null}
      <Typography variant="callout" weight="500">
        {label}
      </Typography>
      {selected ? (
        <FigmaIcon
          name="closeCircle"
          size={16}
          color={theme.colors.textMuted}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 7,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { gap: 5 },
  ageCard: {
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 11,
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: {
    height: 40,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

export default FilterScreen;
