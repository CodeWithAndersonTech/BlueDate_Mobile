import React, { useCallback, useEffect, useMemo, useRef } from 'react';
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
  /** Ignore momentum/end events while we scroll from a tap / +/-. */
  const ignoreScrollSync = useRef(false);
  const ignoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ages = useMemo(
    () => Array.from({ length: max - min + 1 }, (_, i) => min + i),
    [min, max],
  );

  const selected = value != null ? clamp(value, min, max) : null;
  const sidePad = Math.max(0, (windowWidth - 40 - ITEM_WIDTH) / 2);

  const beginProgrammaticScroll = useCallback(() => {
    ignoreScrollSync.current = true;
    if (ignoreTimer.current) {
      clearTimeout(ignoreTimer.current);
    }
    ignoreTimer.current = setTimeout(() => {
      ignoreScrollSync.current = false;
      ignoreTimer.current = null;
    }, 450);
  }, []);

  const scrollToAge = useCallback(
    (age: number, animated = true) => {
      const index = clamp(age, min, max) - min;
      beginProgrammaticScroll();
      listRef.current?.scrollToOffset({
        offset: index * ITEM_WIDTH,
        animated,
      });
    },
    [beginProgrammaticScroll, min, max],
  );

  const selectedRef = useRef(selected);
  const didInitialScroll = useRef(false);

  // First layout: jump rail to the current value (e.g. default 25), not min (18).
  useEffect(() => {
    if (selected == null || didInitialScroll.current) return;
    didInitialScroll.current = true;
    selectedRef.current = selected;
    const index = selected - min;
    beginProgrammaticScroll();
    // Wait one frame so FlatList has measured, then jump without animation.
    const timer = setTimeout(() => {
      listRef.current?.scrollToOffset({
        offset: index * ITEM_WIDTH,
        animated: false,
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [selected, min, beginProgrammaticScroll]);

  // External value changes after mount.
  useEffect(() => {
    if (selected == null || !didInitialScroll.current) return;
    if (selectedRef.current === selected) return;
    selectedRef.current = selected;
    scrollToAge(selected, true);
  }, [selected, scrollToAge]);

  useEffect(() => {
    return () => {
      if (ignoreTimer.current) {
        clearTimeout(ignoreTimer.current);
      }
    };
  }, []);

  const syncFromOffset = (offsetX: number) => {
    if (ignoreScrollSync.current) {
      return;
    }
    const index = Math.round(offsetX / ITEM_WIDTH);
    const next = clamp(min + index, min, max);
    if (next !== selectedRef.current) {
      selectedRef.current = next;
      onChange(next);
    }
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    syncFromOffset(e.nativeEvent.contentOffset.x);
  };

  const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Tap/drag with no momentum still needs a snap sync.
    if (e.nativeEvent.velocity?.x) {
      return;
    }
    syncFromOffset(e.nativeEvent.contentOffset.x);
  };

  const selectAge = (age: number) => {
    const next = clamp(age, min, max);
    // Lock sync BEFORE onChange/re-render so a tap's scroll-end can't snap back.
    beginProgrammaticScroll();
    selectedRef.current = next;
    onChange(next);
    listRef.current?.scrollToOffset({
      offset: (next - min) * ITEM_WIDTH,
      animated: true,
    });
  };

  const step = (delta: number) => {
    const base = selected ?? min;
    selectAge(base + delta);
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
                opacity:
                  selected != null && selected <= min ? 0.4 : pressed ? 0.85 : 1,
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
                opacity:
                  selected != null && selected >= max ? 0.4 : pressed ? 0.85 : 1,
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
            snapToAlignment="start"
            disableIntervalMomentum
            decelerationRate="fast"
            bounces
            nestedScrollEnabled
            directionalLockEnabled
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={false}
            initialScrollIndex={selected != null ? selected - min : 0}
            contentContainerStyle={{ paddingHorizontal: sidePad }}
            getItemLayout={(_, index) => ({
              length: ITEM_WIDTH,
              offset: ITEM_WIDTH * index,
              index,
            })}
            onMomentumScrollEnd={onMomentumEnd}
            onScrollEndDrag={onScrollEndDrag}
            renderItem={({ item }) => {
              const active = item === selected;
              return (
                <Pressable
                  onPress={() => selectAge(item)}
                  hitSlop={4}
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
