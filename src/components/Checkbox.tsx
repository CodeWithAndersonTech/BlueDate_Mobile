import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Icon } from './Icon';

export interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Checkbox({
  checked,
  onChange,
  size = 24,
  disabled = false,
  style,
}: CheckboxProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      hitSlop={8}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={[{ opacity: disabled ? 0.5 : 1 }, style]}>
      {checked ? (
        <View
          style={[
            styles.box,
            {
              width: size,
              height: size,
              borderRadius: 12,
              backgroundColor: theme.colors.plusCta,
            },
          ]}>
          <Icon name="check" size={size * 0.66} color={theme.colors.white} />
        </View>
      ) : (
        <View
          style={[
            styles.box,
            {
              width: size,
              height: size,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: theme.colors.borderStrong,
              backgroundColor: theme.colors.surfaceAlt,
            },
          ]}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});

export default Checkbox;
