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
  /**
   * `status`: selected = green, unselected = red (clear on/off for filters).
   * `default`: primary / muted surface.
   */
  tone?: 'default' | 'status';
}

export function Chip({
  label,
  selected = false,
  icon,
  onPress,
  style,
  tone = 'default',
}: ChipProps) {
  const theme = useTheme();

  const backgroundColor =
    tone === 'status'
      ? selected
        ? theme.colors.success
        : theme.colors.danger
      : selected
        ? theme.colors.primary
        : theme.colors.surfaceAlt;

  const contentColor =
    tone === 'status'
      ? theme.colors.white
      : selected
        ? theme.colors.onPrimary
        : theme.colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityState={{ selected }}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 999,
          backgroundColor,
        },
        style,
      ]}>
      {icon && <Icon name={icon} size={14} color={contentColor} />}
      <Typography variant="callout" weight="600" tint={contentColor}>
        {label}
      </Typography>
    </Pressable>
  );
}

export default Chip;
