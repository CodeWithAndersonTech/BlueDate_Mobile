import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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
        <LinearGradient
          colors={theme.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.box,
            { width: size, height: size, borderRadius: theme.radii.sm },
          ]}>
          <Icon name="check" size={size * 0.66} color={theme.colors.onPrimary} strokeWidth={3} />
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.box,
            {
              width: size,
              height: size,
              borderRadius: theme.radii.sm,
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
