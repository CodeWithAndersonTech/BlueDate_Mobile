import React, { useEffect, useMemo, useRef } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../theme';
import { Icon } from './Icon';
import { Typography } from './Typography';

const MIN_AGE = 18;
const MAX_AGE = 80;
const ITEM_WIDTH = 56;

export type AgePickerProps = {
  value: number | null;
  onChange: (age: number) => void;
  label?: string;
  /** Small label under the big number, e.g. "years old". */
  unitLabel?: string;
  hint?: string;
  error?: string;
  min?: number;
  max?: number;
  style?: StyleProp<ViewStyle>;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function AgePicker({
  value,
  onChange,
  label,
  unitLabel,
  hint,
  error,
  min = MIN_AGE,
  max = MAX_AGE,
  style,
}: AgePickerProps) {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const listRef = useRef<FlatList<number>>(null);
  const ages = useMemo(
    () => Array.from({ length: max - min + 1 }, (_, i) => min + i),
    [min, max],
  );

  const selected = value != null ? clamp(value, min, max) : null;
  const sidePad = Math.max(0, (windowWidth - 40 - ITEM_WIDTH) / 2);

  // Keep the rail aligned when value changes via +/- or external set.
  useEffect(() => {
    if (selected == null) return;
    const index = selected - min;
    const id = requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: index * ITEM_WIDTH,
        animated: true,
      });
    });
    return () => cancelAnimationFrame(id);
  }, [selected, min]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
    const next = clamp(min + index, min, max);
    if (next !== selected) onChange(next);
  };

  const step = (delta: number) => {
    const base = selected ?? min;
    const next = clamp(base + delta, min, max);
    onChange(next);
    listRef.current?.scrollToOffset({
      offset: (next - min) * ITEM_WIDTH,
      animated: true,
    });
  };

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
        <View style={styles.controls}>
          <Pressable
            onPress={() => step(-1)}
            disabled={selected != null && selected <= min}
            hitSlop={8}
            style={({ pressed }) => [
              styles.stepBtn,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                opacity: selected != null && selected <= min ? 0.4 : pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="-1">
            <Icon name="chevron-left" size={20} color={theme.colors.text} />
          </Pressable>

          <View style={styles.selectedBlock}>
            <Typography variant="h1" tint={theme.colors.primary} align="center">
              {selected ?? '—'}
            </Typography>
            {unitLabel ? (
              <Typography variant="caption" color="textMuted" align="center">
                {unitLabel}
              </Typography>
            ) : null}
          </View>

          <Pressable
            onPress={() => step(1)}
            disabled={selected != null && selected >= max}
            hitSlop={8}
            style={({ pressed }) => [
              styles.stepBtn,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                opacity: selected != null && selected >= max ? 0.4 : pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="+1">
            <Icon name="chevron-right" size={20} color={theme.colors.text} />
          </Pressable>
        </View>

        <View style={styles.railWrap}>
          <View
            pointerEvents="none"
            style={[
              styles.centerFrame,
              {
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.primarySoft,
              },
            ]}
          />
          <FlatList
            ref={listRef}
            horizontal
            data={ages}
            keyExtractor={item => String(item)}
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            bounces
            contentContainerStyle={{ paddingHorizontal: sidePad }}
            getItemLayout={(_, index) => ({
              length: ITEM_WIDTH,
              offset: ITEM_WIDTH * index,
              index,
            })}
            onMomentumScrollEnd={onMomentumEnd}
            renderItem={({ item }) => {
              const active = item === selected;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item);
                    listRef.current?.scrollToOffset({
                      offset: (item - min) * ITEM_WIDTH,
                      animated: true,
                    });
                  }}
                  style={styles.item}>
                  <Typography
                    variant={active ? 'title' : 'body'}
                    tint={
                      active ? theme.colors.primary : theme.colors.textMuted
                    }
                    align="center"
                    style={active ? styles.itemActive : undefined}>
                    {item}
                  </Typography>
                </Pressable>
              );
            }}
          />
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
    paddingTop: 14,
    paddingBottom: 10,
    overflow: 'hidden',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBlock: { alignItems: 'center', minWidth: 88, gap: 0 },
  railWrap: {
    height: 52,
    justifyContent: 'center',
  },
  centerFrame: {
    position: 'absolute',
    alignSelf: 'center',
    width: ITEM_WIDTH,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    zIndex: 1,
  },
  item: {
    width: ITEM_WIDTH,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemActive: { fontWeight: '700' },
});

export default AgePicker;
