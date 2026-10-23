import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  DOCK_ACTION_HEIGHT,
  DOCK_PAD_TOP,
  useStickyDockLayout,
} from '../navigation/tabBarLayout';
import { useTheme } from '../theme';

export { DOCK_PAD_TOP };

export interface BottomActionDockProps {
  children: React.ReactNode;
  /**
   * Lift above the floating tab pill. Only for tab-root screens or when
   * Material Top Tabs still paints the pill over a nested scene.
   * Nested stacks (UserProfile, Chat) leave this false.
   */
  forceAboveTabBar?: boolean;
  /** Friend profile = row. Save/apply with helper text = column. */
  direction?: 'row' | 'column';
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}

/**
 * In-flow CTA footer. Sits in the flex column under the scroll view.
 * Owns bottom inset math — screens must not add paddingBottom / +10 / +40.
 */
export function BottomActionDock({
  children,
  forceAboveTabBar = false,
  direction = 'row',
  style,
  elevated = false,
}: BottomActionDockProps) {
  const theme = useTheme();
  const dock = useStickyDockLayout(DOCK_ACTION_HEIGHT, { forceAboveTabBar });

  return (
    <View
      style={[
        styles.dock,
        direction === 'column' ? styles.column : null,
        {
          paddingBottom: dock.dockBottom + dock.dockPaddingBottom,
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
    alignItems: 'center',
    flexShrink: 0,
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: DOCK_PAD_TOP,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  column: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
});

export default BottomActionDock;
