import React, { useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
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
  style?: StyleProp<ViewStyle>;
}

const THUMB = 28;
const TRACK_HEIGHT = 6;

/**
 * Dual-thumb range slider built on PanResponder so it works without any extra
 * native gesture dependency. Values are controlled by the parent.
 */
export function RangeSlider({
  min,
  max,
  step = 1,
  low,
  high,
  onChange,
  style,
}: RangeSliderProps) {
  const theme = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);

  // Keep the latest props in a ref so the (stable) PanResponders never read
  // stale closure values mid-drag.
  const cfg = useRef({ min, max, step, usable: 1, low, high, onChange });
  cfg.current.min = min;
  cfg.current.max = max;
  cfg.current.step = step;
  cfg.current.low = low;
  cfg.current.high = high;
  cfg.current.onChange = onChange;
  cfg.current.usable = Math.max(trackWidth - THUMB, 1);

  const startLow = useRef(low);
  const startHigh = useRef(high);

  const snap = (value: number) => {
    const c = cfg.current;
    const stepped = Math.round((value - c.min) / c.step) * c.step + c.min;
    return Math.min(c.max, Math.max(c.min, stepped));
  };

  const lowPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startLow.current = cfg.current.low;
      },
      onPanResponderMove: (_, gesture) => {
        const c = cfg.current;
        const delta = (gesture.dx / c.usable) * (c.max - c.min);
        const next = Math.min(snap(startLow.current + delta), c.high - c.step);
        c.onChange(next, c.high);
      },
    }),
  ).current;

  const highPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startHigh.current = cfg.current.high;
      },
      onPanResponderMove: (_, gesture) => {
        const c = cfg.current;
        const delta = (gesture.dx / c.usable) * (c.max - c.min);
        const next = Math.max(snap(startHigh.current + delta), c.low + c.step);
        c.onChange(c.low, next);
      },
    }),
  ).current;

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
      <View
        {...lowPan.panHandlers}
        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        style={[styles.thumb, thumbStyle, theme.shadows.sm, { left: lowX }]}
      />
      <View
        {...highPan.panHandlers}
        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        style={[styles.thumb, thumbStyle, theme.shadows.sm, { left: highX }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: THUMB,
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  fill: {
    position: 'absolute',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 3,
  },
});

export default RangeSlider;
