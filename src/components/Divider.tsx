import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Typography } from './Typography';

export interface DividerProps {
  /** Optional centered label, e.g. "or". */
  label?: string;
  spacing?: number;
  style?: StyleProp<ViewStyle>;
}

export function Divider({ label, spacing, style }: DividerProps) {
  const theme = useTheme();
  const marginVertical = spacing ?? theme.spacing.base;

  if (!label) {
    return (
      <View
        style={[{ height: 1, backgroundColor: theme.colors.border, marginVertical }, style]}
      />
    );
  }

  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical },
        style,
      ]}>
      <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
      <Typography variant="caption" color="textMuted">
        {label}
      </Typography>
      <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
    </View>
  );
}

export default Divider;
