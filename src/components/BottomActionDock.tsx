import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

export const DOCK_PAD_TOP = 12;
export const DOCK_MIN_BOTTOM = 12;

export interface BottomActionDockProps {
  children: React.ReactNode;
  /** Extra space above the home-indicator inset. Default 0. */
  extraBottom?: number;
  style?: StyleProp<ViewStyle>;
  /** Soft surface instead of page background. */
  elevated?: boolean;
}

/**
 * In-flow footer for nested screens (save / apply / message CTAs).
 * Owns safe-area bottom padding so docks stay flush with the screen edge
 * without magic +40 offsets.
 */
export function BottomActionDock({
  children,
  extraBottom = 0,
  style,
  elevated = false,
}: BottomActionDockProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.dock,
        {
          paddingBottom: Math.max(insets.bottom, DOCK_MIN_BOTTOM) + extraBottom,
          backgroundColor: elevated
            ? theme.colors.surface
            : theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: DOCK_PAD_TOP,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

export default BottomActionDock;
