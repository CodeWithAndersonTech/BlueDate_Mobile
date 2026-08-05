import React, { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../theme';

export interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  /** Lower selected value. */
  low: number;
  /** Upper selected value. */
  high: number;
  onChange: (low: number, high: number) => void;
  /** Fired when a thumb drag begins — disable parent ScrollView. */
  onSlidingStart?: () => void;
  /** Fired when a thumb drag ends — re-enable parent ScrollView. */
  onSlidingComplete?: () => void;
  style?: StyleProp<ViewStyle>;
}

const THUMB = 28;
const HIT = 44;
const TRACK_HEIGHT = 6;

/**
 * Dual-thumb range slider. Uses RNGH pan gestures so it wins over a parent
 * ScrollView instead of fighting RN PanResponder termination.
 */
export function RangeSlider({
  min,
  max,
  step = 1,
  low,
  high,
  onChange,
  onSlidingStart,
  onSlidingComplete,
  style,
}: RangeSliderProps) {
  const theme = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);

  const cfg = useRef({
    min,
    max,
    step,
    usable: 1,
    low,
    high,
    onChange,
    onSlidingStart,
    onSlidingComplete,
  });
  cfg.current.min = min;
  cfg.current.max = max;
  cfg.current.step = step;
  cfg.current.low = low;
  cfg.current.high = high;
  cfg.current.onChange = onChange;
  cfg.current.onSlidingStart = onSlidingStart;
  cfg.current.onSlidingComplete = onSlidingComplete;
  cfg.current.usable = Math.max(trackWidth - THUMB, 1);

  const startLow = useRef(low);
  const startHigh = useRef(high);

  const snap = (value: number) => {
    const c = cfg.current;
    const stepped = Math.round((value - c.min) / c.step) * c.step + c.min;
    return Math.min(c.max, Math.max(c.min, stepped));
  };

  const valueFromX = (x: number) => {
    const c = cfg.current;
    const ratio = Math.min(1, Math.max(0, (x - THUMB / 2) / c.usable));
    return snap(c.min + ratio * (c.max - c.min));
  };

  const lowGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .hitSlop(16)
        .minDistance(0)
        .onBegin(() => {
          startLow.current = cfg.current.low;
          cfg.current.onSlidingStart?.();
        })
        .onUpdate(e => {
          const c = cfg.current;
          const delta = (e.translationX / c.usable) * (c.max - c.min);
          const next = Math.min(snap(startLow.current + delta), c.high - c.step);
          if (next !== c.low) c.onChange(next, c.high);
        })
        .onFinalize(() => {
          cfg.current.onSlidingComplete?.();
        }),
    // Stable gesture; reads latest via cfg ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const highGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .hitSlop(16)
        .minDistance(0)
        .onBegin(() => {
          startHigh.current = cfg.current.high;
          cfg.current.onSlidingStart?.();
        })
        .onUpdate(e => {
          const c = cfg.current;
          const delta = (e.translationX / c.usable) * (c.max - c.min);
          const next = Math.max(snap(startHigh.current + delta), c.low + c.step);
          if (next !== c.high) c.onChange(c.low, next);
        })
        .onFinalize(() => {
          cfg.current.onSlidingComplete?.();
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const trackTap = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .onEnd(e => {
          const c = cfg.current;
          const next = valueFromX(e.x);
          const mid = (c.low + c.high) / 2;
          if (next <= mid) {
            c.onChange(Math.min(next, c.high - c.step), c.high);
          } else {
            c.onChange(c.low, Math.max(next, c.low + c.step));
          }
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onLayout = (e: LayoutChangeEvent) =>
    setTrackWidth(e.nativeEvent.layout.width);

  const usable = cfg.current.usable;
  const range = max - min || 1;
  const lowX = ((low - min) / range) * usable;
  const highX = ((high - min) / range) * usable;

  const thumbStyle: ViewStyle = {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.primary,
  };

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      <GestureDetector gesture={trackTap}>
        <View style={StyleSheet.absoluteFill} collapsable={false}>
          <View
            style={[
              styles.track,
              { backgroundColor: theme.colors.surfaceAlt },
            ]}
          />
          <View
            style={[
              styles.fill,
              {
                left: lowX + THUMB / 2,
                width: Math.max(highX - lowX, 0),
                backgroundColor: theme.colors.primary,
              },
            ]}
          />
        </View>
      </GestureDetector>

      <GestureDetector gesture={lowGesture}>
        <View
          style={[styles.hit, { left: lowX - (HIT - THUMB) / 2 }]}
          collapsable={false}>
          <View style={[styles.thumb, thumbStyle, theme.shadows.sm]} />
        </View>
      </GestureDetector>

      <GestureDetector gesture={highGesture}>
        <View
          style={[styles.hit, { left: highX - (HIT - THUMB) / 2 }]}
          collapsable={false}>
          <View style={[styles.thumb, thumbStyle, theme.shadows.sm]} />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HIT,
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (HIT - TRACK_HEIGHT) / 2,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  fill: {
    position: 'absolute',
    top: (HIT - TRACK_HEIGHT) / 2,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  hit: {
    position: 'absolute',
    width: HIT,
    height: HIT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 3,
  },
});

export default RangeSlider;
