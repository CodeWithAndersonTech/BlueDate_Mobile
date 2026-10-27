import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { images } from '../../assets';
import { useTheme } from '../../theme';
import { FigmaSpinner } from '../FigmaUi';
import { Typography } from '../Typography';

type Props = {
  provider: 'google' | 'apple';
  label: string;
  onPress: () => void;
};

const APPLE =
  'M15.4909 6.818C15.3769 6.908 13.3641 8.062 13.3641 10.628C13.3641 13.596 15.9253 14.646 16.002 14.672C15.9902 14.736 15.5951 16.11 14.6516 17.51C13.8103 18.742 12.9317 19.972 11.5951 19.972C10.2585 19.972 9.9145 19.182 8.3715 19.182C6.86781 19.182 6.33317 19.998 5.11057 19.998C3.88796 19.998 3.03489 18.858 2.05405 17.458C0.917936 15.814 0 13.26 0 10.836C0 6.948 2.48452 4.886 4.92973 4.886C6.22899 4.886 7.31204 5.754 8.12776 5.754C8.90418 5.754 10.115 4.834 11.5931 4.834C12.1533 4.834 14.1661 4.886 15.4909 6.818ZM10.8914 3.188C11.5027 2.45 11.9351 1.426 11.9351 0.402C11.9351 0.26 11.9233 0.116 11.8978 0C10.9032 0.038 9.7199 0.674 9.00639 1.516C8.44619 2.164 7.92334 3.188 7.92334 4.226C7.92334 4.382 7.94889 4.538 7.96069 4.588C8.02359 4.6 8.1258 4.614 8.22801 4.614C9.12039 4.614 10.2428 4.006 10.8914 3.188Z';

export function AuthSocialButton({ provider, label, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.authField,
          borderColor: theme.colors.authFieldBorder,
        },
      ]}>
      <View style={styles.inner}>
        {provider === 'google' ? (
          <Image source={images.googleLogo} style={styles.google} />
        ) : (
          <Svg width={16} height={20} viewBox="0 0 16.002 19.998">
            <Path d={APPLE} fill={theme.colors.text} />
          </Svg>
        )}
        <Typography variant="caption" weight="500">
          {label}
        </Typography>
      </View>
    </Pressable>
  );
}

export function AuthPrimaryButton({
  label,
  loading,
  onPress,
}: {
  label: string;
  loading?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[
        styles.cta,
        { backgroundColor: theme.colors.plusCta },
      ]}>
      {loading ? (
        <FigmaSpinner size={18} color={theme.colors.white} />
      ) : (
        <Typography variant="callout" weight="600" tint={theme.colors.white}>
          {label}
        </Typography>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  google: { width: 20, height: 20 },
  cta: {
    height: 51,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
