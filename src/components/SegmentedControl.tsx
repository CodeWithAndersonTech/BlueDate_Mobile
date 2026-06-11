import React, { useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../theme';
import { Typography } from './Typography';

export interface SegmentItem {
  key: string;
  label: string;
  /** Optional count badge, e.g. pending requests. */
  badge?: number;
}

export interface SegmentedControlProps {
  items: SegmentItem[];
  value: string;
  onChange: (key: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function SegmentedControl({
  items,
  value,
  onChange,
  style,
}: SegmentedControlProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    items.findIndex(i => i.key === value),
  );
  const segWidth = width > 0 ? width / items.length : 0;

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: segWidth,
    transform: [{ translateX: withSpring(segWidth * index, { damping: 18, stiffness: 220 }) }],
  }));

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderRadius: theme.radii.lg,
          padding: 4,
        },
        style,
      ]}>
      {segWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            indicatorStyle,
            {
              backgroundColor: theme.colors.card,
              borderRadius: theme.radii.md,
              ...theme.shadows.sm,
            },
          ]}
        />
      )}
      {items.map(item => {
        const active = item.key === value;
        return (
          <Pressable
            key={item.key}
            style={styles.segment}
            onPress={() => onChange(item.key)}>
            <Typography
              variant="callout"
              tint={active ? theme.colors.text : theme.colors.textMuted}
              numberOfLines={1}>
              {item.label}
              {item.badge ? `  ${item.badge}` : ''}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    zIndex: 1,
  },
});

export default SegmentedControl;
