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
  const recipe = theme.components.chip;

  const backgroundColor =
    tone === 'status'
      ? selected
        ? theme.colors.success
        : theme.colors.danger
      : selected
        ? theme.colors.plusCta
        : theme.colors.surfaceAlt;

  const contentColor =
    tone === 'status'
      ? theme.colors.white
      : selected
        ? theme.colors.white
        : theme.colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityState={{ selected }}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: recipe.gap,
          paddingVertical: recipe.paddingV,
          paddingHorizontal: recipe.paddingH,
          borderRadius: recipe.radius,
          backgroundColor,
        },
        style,
      ]}>
      {icon && <Icon name={icon} size={recipe.icon} color={contentColor} />}
      <Typography variant="callout" weight="600" tint={contentColor}>
        {label}
      </Typography>
    </Pressable>
  );
}

export default Chip;
