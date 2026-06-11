import React from 'react';
import { Switch as RNSwitch, Platform } from 'react-native';
import { useTheme } from '../theme';

export interface SwitchProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}

/** Theme-aware wrapper around the native Switch. */
export function Switch({ value, onValueChange, disabled }: SwitchProps) {
  const theme = useTheme();
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: theme.colors.surfaceAlt, true: theme.colors.primary }}
      thumbColor={
        Platform.OS === 'android'
          ? value
            ? theme.colors.white
            : theme.colors.textMuted
          : undefined
      }
      ios_backgroundColor={theme.colors.surfaceAlt}
    />
  );
}

export default Switch;
