import React, { forwardRef } from 'react';
import { StyleProp, TextInput, ViewStyle } from 'react-native';
import { useLocale } from '../../i18n';
import { Input, InputProps } from '../Input';

type FieldProps = Omit<
  InputProps,
  'leftIcon' | 'password' | 'keyboardType' | 'autoCapitalize'
> & {
  containerStyle?: StyleProp<ViewStyle>;
};

export const FirstNameInput = forwardRef<TextInput, FieldProps>(
  function FirstNameInput({ label, placeholder, ...props }, ref) {
    const { t } = useLocale();
    return (
      <Input
        ref={ref}
        label={label ?? t('auth.first_name')}
        placeholder={placeholder ?? t('auth.first_name_placeholder')}
        leftIcon="user"
        autoCapitalize="words"
        autoComplete="given-name"
        textContentType="givenName"
        returnKeyType="next"
        {...props}
      />
    );
  },
);

export const LastNameInput = forwardRef<TextInput, FieldProps>(
  function LastNameInput({ label, placeholder, ...props }, ref) {
    const { t } = useLocale();
    return (
      <Input
        ref={ref}
        label={label ?? t('auth.last_name')}
        placeholder={placeholder ?? t('auth.last_name_placeholder')}
        leftIcon="user"
        autoCapitalize="words"
        autoComplete="family-name"
        textContentType="familyName"
        returnKeyType="next"
        {...props}
      />
    );
  },
);

export const EmailInput = forwardRef<TextInput, FieldProps>(
  function EmailInput({ label, placeholder, ...props }, ref) {
    const { t } = useLocale();
    return (
      <Input
        ref={ref}
        label={label ?? t('auth.email')}
        placeholder={placeholder ?? t('auth.email_placeholder')}
        leftIcon="mail"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        {...props}
      />
    );
  },
);

export const UsernameInput = forwardRef<TextInput, FieldProps>(
  function UsernameInput({ label, placeholder, ...props }, ref) {
    const { t } = useLocale();
    return (
      <Input
        ref={ref}
        label={label ?? t('auth.username')}
        placeholder={placeholder ?? t('auth.username_placeholder')}
        leftIcon="sparkles"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
        {...props}
      />
    );
  },
);

type PasswordFieldProps = FieldProps;

export const PasswordInput = forwardRef<TextInput, PasswordFieldProps>(
  function PasswordInput({ label, placeholder, ...props }, ref) {
    const { t } = useLocale();
    return (
      <Input
        ref={ref}
        label={label ?? t('auth.password')}
        placeholder={placeholder ?? t('auth.password_hint')}
        leftIcon="lock"
        password
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="password-new"
        textContentType="newPassword"
        returnKeyType="next"
        {...props}
      />
    );
  },
);

export const ConfirmPasswordInput = forwardRef<TextInput, FieldProps>(
  function ConfirmPasswordInput({ label, placeholder, ...props }, ref) {
    const { t } = useLocale();
    return (
      <Input
        ref={ref}
        label={label ?? t('auth.confirm_password')}
        placeholder={placeholder ?? t('auth.confirm_password_hint')}
        leftIcon="lock"
        password
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="password-new"
        textContentType="newPassword"
        returnKeyType="done"
        {...props}
      />
    );
  },
);
