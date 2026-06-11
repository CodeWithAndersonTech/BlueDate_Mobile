import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Typography } from './Typography';

export interface StatItemProps {
  value: string | number;
  label: string;
  align?: 'center' | 'flex-start';
  style?: StyleProp<ViewStyle>;
}

export function StatItem({ value, label, align = 'center', style }: StatItemProps) {
  return (
    <View style={[styles.container, { alignItems: align }, style]}>
      <Typography variant="h3">{value}</Typography>
      <Typography variant="caption" color="textMuted">
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 2 },
});

export default StatItem;
