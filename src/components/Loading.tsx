import React, { useEffect } from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { images } from '../assets';
import { useTheme } from '../theme';

export interface LoadingProps {
  /** Optional caption shown under the brand mark. */
  message?: string;
  /** Show the "Meerk" wordmark under the logo. */
  showBrand?: boolean;
  /** Logo edge length in px. */
  size?: number;
  /**
   * When true (default) the loader fills its parent and centres itself so a
   * screen can gate its content behind it. When false it renders inline.
   */
  fullscreen?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Branded loader using the Meerk app icon.
 */
export function Loading({
  message,
  showBrand = true,
  size = 88,
  fullscreen = true,
  style,
}: LoadingProps) {
  const theme = useTheme();
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.94 + pulse.value * 0.06 }],
    opacity: 0.88 + pulse.value * 0.12,
  }));

  return (
    <View style={[fullscreen ? styles.fullscreen : styles.inline, style]}>
      <Animated.View style={[styles.logoWrap, theme.shadows.sm, logoStyle]}>
        <Image
          source={images.appLogo}
          style={{ width: size, height: size, borderRadius: size * 0.22 }}
        />
      </Animated.View>

      {showBrand ? (
        <Text style={[styles.brand, { color: theme.colors.text }]}>Meerk</Text>
      ) : null}

      {message ? (
        <Text style={[styles.message, { color: theme.colors.textMuted }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 24,
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 32,
  },
  logoWrap: {
    borderRadius: 22,
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
});

export default Loading;
