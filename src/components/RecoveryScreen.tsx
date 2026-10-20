import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { images } from '../assets';
import { localizedCrashCopy } from '../i18n';
import { darkTheme } from '../theme';

type Props = {
  languageCode?: string;
  onRetry?: () => void;
  onLeave?: () => void;
};

/**
 * Branded holding screen for a crash or a session whose account no longer exists.
 * Safe without Theme/Locale providers (ErrorBoundary sits above both).
 * Copy always follows the selected / device language.
 */
export function RecoveryScreen({ languageCode, onRetry, onLeave }: Props) {
  const copy = localizedCrashCopy(languageCode);
  return (
    <View style={styles.root}>
      <View style={styles.center}>
        <Image source={images.appLogo} style={styles.logo} />
        <Text style={styles.brand}>Meerk</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.message}>{copy.message}</Text>
        {onRetry ? (
          <Pressable
            onPress={onRetry}
            style={styles.btn}
            accessibilityRole="button">
            <Text style={styles.btnLabel}>{copy.retry}</Text>
          </Pressable>
        ) : null}
        {onLeave ? (
          <Pressable
            onPress={onLeave}
            style={styles.leave}
            accessibilityRole="button">
            <Text style={styles.leaveLabel}>{copy.leave}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  center: {
    alignItems: 'center',
    maxWidth: 320,
    gap: 10,
  },
  logo: {
    width: 112,
    height: 112,
    borderRadius: 28,
    marginBottom: 8,
  },
  brand: {
    color: darkTheme.colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  title: {
    color: darkTheme.colors.text,
    ...darkTheme.typography.variants.h3,
    textAlign: 'center',
    marginTop: 8,
  },
  message: {
    color: darkTheme.colors.textMuted,
    ...darkTheme.typography.variants.callout,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    marginTop: 18,
    backgroundColor: darkTheme.colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  btnLabel: {
    color: darkTheme.colors.onPrimary,
    ...darkTheme.typography.variants.button,
    fontSize: darkTheme.typography.fontSize.md,
  },
  leave: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  leaveLabel: {
    color: darkTheme.colors.textMuted,
    ...darkTheme.typography.variants.button,
    fontSize: darkTheme.typography.fontSize.sm,
  },
});

export default RecoveryScreen;
