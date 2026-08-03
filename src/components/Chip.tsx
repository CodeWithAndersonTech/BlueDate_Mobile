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

export function Chip({
  label,
  selected = false,
  icon,
  onPress,
  style,
}: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 999,
          backgroundColor: selected
            ? theme.colors.primary
            : theme.colors.surfaceAlt,
        },
        style,
      ]}>
      {icon && (
        <Icon
          name={icon}
          size={14}
          color={selected ? theme.colors.onPrimary : theme.colors.textSecondary}
        />
      )}
      <Typography
        variant="callout"
        weight="600"
        tint={selected ? theme.colors.onPrimary : theme.colors.textSecondary}>
        {label}
      </Typography>
    </Pressable>
  );
}

export default Chip;
