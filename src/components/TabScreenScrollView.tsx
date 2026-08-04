import React from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import { useTabBarClearance } from '../navigation/tabBarLayout';

export interface TabScreenScrollViewProps extends ScrollViewProps {
  /**
   * Extra space between the last content item and the floating tab bar.
   * Screens with sticky bottom UI should pass their dock height here.
   */
  bottomSpacing?: number;
}

/**
 * ScrollView for tab-root screens. Always pads the bottom via
 * contentContainerStyle so the last items scroll clear of the floating
 * pill tab bar (pill height + device safe area included).
 */
export function TabScreenScrollView({
  bottomSpacing = 8,
  contentContainerStyle,
  children,
  ...props
}: TabScreenScrollViewProps) {
  const clearance = useTabBarClearance(16);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      {...props}
      contentContainerStyle={[
        contentContainerStyle,
        { paddingBottom: bottomSpacing + clearance },
      ]}>
      {children}
    </ScrollView>
  );
}

export default TabScreenScrollView;
