import React, { forwardRef, useCallback, useState } from 'react';
import {
  Platform,
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

const FIELD_HEIGHT = 56;

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    leftIcon,
    password = false,
    error,
    hint,
    containerStyle,
    onFocus,
    onBlur,
    blurOnSubmit,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(password);

  const borderColor = error
    ? theme.colors.danger
    : focused
    ? theme.colors.primary
    : theme.colors.border;

  const handleFocus = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      setFocused(true);
      onFocus?.(e);
    },
    [onFocus],
  );

  const handleBlur = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      setFocused(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Typography variant="caption" color="textSecondary" style={styles.label}>
          {label}
        </Typography>
      ) : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surfaceAlt,
            borderColor,
            borderRadius: theme.radii.md,
            paddingHorizontal: theme.spacing.base,
          },
        ]}>
        {leftIcon ? (
          <Icon
            name={leftIcon}
            size={20}
            color={focused ? theme.colors.primary : theme.colors.textMuted}
          />
        ) : null}
        <TextInput
          ref={ref}
          {...rest}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.regular,
              // Avoid body variant's tall lineHeight — it pushes glyphs downward.
              lineHeight: Platform.OS === 'ios' ? 0 : theme.typography.fontSize.base + 4,
            },
          ]}
          placeholderTextColor={theme.colors.textMuted}
          blurOnSubmit={blurOnSubmit ?? false}
          secureTextEntry={password ? hidden : false}
          textAlignVertical="center"
          underlineColorAndroid="transparent"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {password ? (
          <Pressable
            hitSlop={10}
            onPress={() => setHidden(h => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Şifreyi göster' : 'Şifreyi gizle'}>
            <Icon
              name={hidden ? 'eye-off' : 'eye'}
              size={20}
              color={theme.colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error || hint ? (
        <Typography
          variant="caption"
          tint={error ? theme.colors.danger : theme.colors.textMuted}
          style={styles.helper}>
          {error ?? hint}
        </Typography>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  label: { marginBottom: 6, marginLeft: 4 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: FIELD_HEIGHT,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    margin: 0,
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
  },
  helper: { marginTop: 6, marginLeft: 4 },
});

export default Input;
