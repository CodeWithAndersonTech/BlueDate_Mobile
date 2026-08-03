import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

export interface SettingsGroupProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Apple Settings–style grouped card shell. */
export function SettingsGroup({ children, style }: SettingsGroupProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.group,
        {
          backgroundColor: theme.colors.card,
          borderRadius: 20,
        },
        theme.shadows.sm,
        style,
      ]}>
      {children}
    </View>
  );
}

export function SettingsSep() {
  const theme = useTheme();
  return (
    <View style={[styles.sep, { backgroundColor: theme.colors.border }]} />
  );
}

const styles = StyleSheet.create({
  group: {
    overflow: 'hidden',
    paddingVertical: 2,
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 62,
  },
});

export default SettingsGroup;
