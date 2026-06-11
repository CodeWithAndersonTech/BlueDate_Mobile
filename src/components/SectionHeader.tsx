import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Typography } from './Typography';

export interface SectionHeaderProps {
  title: string;
  /** Optional trailing action label, e.g. "Tümünü gör". */
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  style,
}: SectionHeaderProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, style]}>
      <Typography variant="h3">{title}</Typography>
      {actionLabel && (
        <Pressable hitSlop={8} onPress={onAction}>
          <Typography variant="callout" tint={theme.colors.primary}>
            {actionLabel}
          </Typography>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default SectionHeader;
