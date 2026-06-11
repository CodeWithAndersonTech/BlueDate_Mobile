import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Icon, IconName } from './Icon';
import { Typography } from './Typography';

export interface ChipProps {
  label: string;
  selected?: boolean;
  icon?: IconName;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, selected = false, icon, onPress, style }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: theme.radii.pill,
          borderWidth: 1,
          backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
        style,
      ]}>
      {icon && (
        <Icon
          name={icon}
          size={15}
          color={selected ? theme.colors.primary : theme.colors.textSecondary}
        />
      )}
      <Typography
        variant="callout"
        tint={selected ? theme.colors.primary : theme.colors.textSecondary}>
        {label}
      </Typography>
    </Pressable>
  );
}

export default Chip;
