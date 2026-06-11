import React, { useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';
import { Icon, IconName } from './Icon';
import { Typography } from './Typography';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  leftIcon?: IconName;
  /** Toggle visibility affordance for password fields. */
  password?: boolean;
  error?: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  leftIcon,
  password = false,
  error,
  hint,
  containerStyle,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(password);

  const borderColor = error
    ? theme.colors.danger
    : focused
    ? theme.colors.primary
    : theme.colors.border;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Typography variant="caption" color="textSecondary" style={styles.label}>
          {label}
        </Typography>
      )}
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surfaceAlt,
            borderColor,
            borderRadius: theme.radii.md,
            paddingHorizontal: theme.spacing.base,
          },
          focused && theme.shadows.sm,
        ]}>
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={20}
            color={focused ? theme.colors.primary : theme.colors.textMuted}
          />
        )}
        <TextInput
          style={[
            styles.input,
            theme.typography.variants.body,
            { color: theme.colors.text },
          ]}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={hidden}
          onFocus={e => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {password && (
          <Pressable hitSlop={10} onPress={() => setHidden(h => !h)}>
            <Icon
              name={hidden ? 'eye-off' : 'eye'}
              size={20}
              color={theme.colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {(error || hint) && (
        <Typography
          variant="caption"
          tint={error ? theme.colors.danger : theme.colors.textMuted}
          style={styles.helper}>
          {error ?? hint}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  label: { marginBottom: 6, marginLeft: 4 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 54,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
  helper: { marginTop: 6, marginLeft: 4 },
});

export default Input;
