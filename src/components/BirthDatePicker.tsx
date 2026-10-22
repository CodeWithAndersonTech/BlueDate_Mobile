import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useLocale } from '../i18n';
import { useTheme } from '../theme';
import {
  BirthParts,
  clampDay,
  daysInMonth,
  yearRange,
} from '../utils/birthDate';
import { zodiacFromMonthDay } from '../utils/zodiac';
import { Typography } from './Typography';

const ROW_H = 40;

type WheelProps = {
  data: number[];
  value: number;
  onChange: (value: number) => void;
  formatLabel: (value: number) => string;
  accessibilityLabel: string;
};

function WheelColumn({
  data,
  value,
  onChange,
  formatLabel,
  accessibilityLabel,
}: WheelProps) {
  const theme = useTheme();
  const listRef = useRef<ScrollView>(null);
  const ignoreSync = useRef(false);
  const ignoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef(value);
  const didInit = useRef(false);

  const indexOf = useCallback(
    (v: number) => Math.max(0, data.indexOf(v)),
    [data],
  );

  const beginProgrammatic = useCallback(() => {
    ignoreSync.current = true;
    if (ignoreTimer.current) clearTimeout(ignoreTimer.current);
    ignoreTimer.current = setTimeout(() => {
      ignoreSync.current = false;
      ignoreTimer.current = null;
    }, 420);
  }, []);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    valueRef.current = value;
    beginProgrammatic();
    const t = setTimeout(() => {
      listRef.current?.scrollTo({
        y: indexOf(value) * ROW_H,
        animated: false,
      });
    }, 0);
    return () => clearTimeout(t);
  }, [beginProgrammatic, indexOf, value]);

  useEffect(() => {
    if (!didInit.current) return;
    if (valueRef.current === value) return;
    valueRef.current = value;
    beginProgrammatic();
    listRef.current?.scrollTo({
      y: indexOf(value) * ROW_H,
      animated: true,
    });
  }, [beginProgrammatic, indexOf, value]);

  useEffect(
    () => () => {
      if (ignoreTimer.current) clearTimeout(ignoreTimer.current);
    },
    [],
  );

  const syncFromOffset = (offsetY: number) => {
    if (ignoreSync.current) return;
    const index = Math.round(offsetY / ROW_H);
    const next = data[Math.min(Math.max(0, index), data.length - 1)];
    if (next != null && next !== valueRef.current) {
      valueRef.current = next;
      onChange(next);
    }
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    syncFromOffset(e.nativeEvent.contentOffset.y);
  };

  const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (e.nativeEvent.velocity?.y) return;
    syncFromOffset(e.nativeEvent.contentOffset.y);
  };

  return (
    <View style={styles.wheel} accessibilityLabel={accessibilityLabel}>
      <View
        pointerEvents="none"
        style={[
          styles.wheelHighlight,
          {
            borderColor: theme.colors.plusCta,
            backgroundColor: theme.colors.plusSoft,
          },
        ]}
      />
      <ScrollView
        ref={listRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW_H}
        decelerationRate="fast"
        disableIntervalMomentum
        nestedScrollEnabled
        bounces
        style={styles.wheelList}
        contentContainerStyle={{ paddingVertical: ROW_H }}
        onMomentumScrollEnd={onMomentumEnd}
        onScrollEndDrag={onScrollEndDrag}>
        {data.map(item => {
          const active = item === value;
          return (
            <View key={item} style={styles.wheelRow}>
              <Text
                style={[
                  styles.wheelLabel,
                  {
                    color: active
                      ? theme.colors.plusCta
                      : theme.colors.textMuted,
                    fontWeight: active ? '700' : '500',
                    fontSize: active ? 17 : 15,
                  },
                ]}>
                {formatLabel(item)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export type BirthDatePickerProps = {
  value: BirthParts;
  onChange: (next: BirthParts) => void;
  label?: string;
  hint?: string;
  error?: string;
  style?: StyleProp<ViewStyle>;
};

export function BirthDatePicker({
  value,
  onChange,
  label,
  hint,
  error,
  style,
}: BirthDatePickerProps) {
  const theme = useTheme();
  const { t, languageCode } = useLocale();
  const { min: minYear, max: maxYear } = useMemo(() => yearRange(), []);

  const years = useMemo(
    () =>
      Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i),
    [minYear, maxYear],
  );
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const days = useMemo(
    () =>
      Array.from(
        { length: daysInMonth(value.year, value.month) },
        (_, i) => i + 1,
      ),
    [value.year, value.month],
  );

  const monthLabels = useMemo(() => {
    const locale = languageCode === 'tr' ? 'tr-TR' : 'en-US';
    return months.map(m =>
      new Date(2000, m - 1, 1).toLocaleString(locale, { month: 'short' }),
    );
  }, [languageCode, months]);

  const zodiac = zodiacFromMonthDay(value.month, value.day);

  const patch = useCallback(
    (partial: Partial<BirthParts>) => {
      const year = partial.year ?? value.year;
      const month = partial.month ?? value.month;
      const day = clampDay(year, month, partial.day ?? value.day);
      onChange({ year, month, day });
    },
    [onChange, value.day, value.month, value.year],
  );

  return (
    <View style={[styles.root, style]}>
      {label ? (
        <Typography variant="caption" color="textSecondary">
          {label}
        </Typography>
      ) : null}

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surfaceAlt,
            borderColor: error ? theme.colors.danger : theme.colors.border,
          },
        ]}>
        <View style={styles.headers}>
          <Typography
            variant="caption"
            color="textMuted"
            align="center"
            style={styles.headerCell}>
            {t('auth.day')}
          </Typography>
          <Typography
            variant="caption"
            color="textMuted"
            align="center"
            style={styles.headerCell}>
            {t('auth.month')}
          </Typography>
          <Typography
            variant="caption"
            color="textMuted"
            align="center"
            style={styles.headerCell}>
            {t('auth.year')}
          </Typography>
        </View>

        <View style={styles.wheels}>
          <WheelColumn
            key={`d-${value.year}-${value.month}`}
            data={days}
            value={value.day}
            onChange={day => patch({ day })}
            formatLabel={d => String(d).padStart(2, '0')}
            accessibilityLabel={t('auth.day')}
          />
          <WheelColumn
            data={months}
            value={value.month}
            onChange={month => patch({ month })}
            formatLabel={m => monthLabels[m - 1] ?? String(m)}
            accessibilityLabel={t('auth.month')}
          />
          <WheelColumn
            data={years}
            value={value.year}
            onChange={year => patch({ year })}
            formatLabel={y => String(y)}
            accessibilityLabel={t('auth.year')}
          />
        </View>

        <View style={styles.meta}>
          <Text
            accessibilityRole="text"
            accessibilityLabel={zodiac.id}
            style={[styles.zodiac, { color: theme.colors.text }]}>
            {zodiac.symbol}
          </Text>
        </View>
      </View>

      {error ? (
        <Typography variant="caption" color="danger">
          {error}
        </Typography>
      ) : hint ? (
        <Typography variant="caption" color="textMuted">
          {hint}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingBottom: 14,
    overflow: 'hidden',
  },
  headers: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  headerCell: { flex: 1 },
  wheels: {
    flexDirection: 'row',
    height: ROW_H * 3,
    paddingHorizontal: 4,
  },
  wheel: {
    flex: 1,
    height: ROW_H * 3,
    overflow: 'hidden',
  },
  wheelList: { flex: 1 },
  wheelHighlight: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: ROW_H,
    height: ROW_H,
    borderRadius: 12,
    borderWidth: 1.5,
    zIndex: 1,
  },
  wheelRow: {
    height: ROW_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelLabel: {
    textAlign: 'center',
  },
  meta: {
    marginTop: 12,
    alignItems: 'center',
  },
  zodiac: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '600',
  },
});

export default BirthDatePicker;
