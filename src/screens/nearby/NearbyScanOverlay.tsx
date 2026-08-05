import React, { useEffect } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { images } from '../../assets';
import { useLocale } from '../../i18n';
import {
  useFloatingTabOffset,
  useTabBarClearance,
} from '../../navigation/tabBarLayout';
import { useTheme } from '../../theme';

type Props = {
  visible: boolean;
  onCancel?: () => void;
};

function RadarRing({
  delay,
  color,
}: {
  delay: number;
  color: string;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.15, 1],
      [0.45, 0.28, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          progress.value,
          [0, 1],
          [0.55, 2.35],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        { borderColor: color },
        style,
      ]}
    />
  );
}

/**
 * Nearby scan overlay — translucent scrim over the current screen.
 *
 * Important: RN 0.86 removed StyleSheet.absoluteFillObject. Overlay root MUST
 * use explicit absolute fill, otherwise it falls into normal layout flow and
 * piles up under the floating tab bar (which is what the screenshot showed).
 *
 * Layout:
 * - scrim fills the whole screen
 * - logo / brand / copy are centered in the usable area ABOVE the tab bar
 * - Stop scan docks just above the floating pill
 */
export function NearbyScanOverlay({ visible, onCancel }: Props) {
  const theme = useTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const tabBarClearance = useTabBarClearance(16);
  const stopOffset = useFloatingTabOffset(12);
  const pulse = useSharedValue(0);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      fade.value = 0;
      return;
    }
    fade.value = withTiming(1, { duration: 280 });
    pulse.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [visible, fade, pulse]);

  const rootStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.94 + pulse.value * 0.08 }],
  }));

  if (!visible) {
    return null;
  }

  const ringColor = theme.isDark
    ? 'rgba(245, 215, 110, 0.55)'
    : theme.colors.primary;
  const backdropColor = theme.isDark
    ? 'rgba(5, 5, 12, 0.78)'
    : 'rgba(248, 248, 252, 0.86)';

  return (
    <Animated.View
      style={[styles.root, rootStyle]}
      pointerEvents="auto"
      accessibilityViewIsModal
      accessibilityLabel={t('nearby.scanning')}>
      <View
        style={[styles.fill, { backgroundColor: backdropColor }]}
        pointerEvents="none"
      />

      {/* Usable area between status bar and tab bar — logo centers here */}
      <View
        style={[styles.main, { top: insets.top, bottom: tabBarClearance }]}
        pointerEvents="none">
        <View style={styles.radar}>
          <RadarRing delay={0} color={ringColor} />
          <RadarRing delay={700} color={ringColor} />
          <RadarRing delay={1400} color={ringColor} />

          <Animated.View style={[styles.logoWrap, theme.shadows.md, logoStyle]}>
            <Image source={images.appLogo} style={styles.logo} />
          </Animated.View>
        </View>

        <Text style={[styles.brand, { color: theme.colors.text }]}>Meerk</Text>
        <Text style={[styles.message, { color: theme.colors.textMuted }]}>
          {t('nearby.scanning')}
        </Text>
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
          {t('nearby.scanning_hint')}
        </Text>
      </View>

      {onCancel ? (
        <View style={[styles.actionDock, { bottom: stopOffset }]}>
          <Pressable
            onPress={onCancel}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('nearby.scan_cancel')}
            style={[
              styles.cancelBtn,
              theme.shadows.sm,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.border,
              },
            ]}>
            <Text style={[styles.cancelLabel, { color: theme.colors.text }]}>
              {t('nearby.scan_cancel')}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </Animated.View>
  );
}

const LOGO = 112;

const styles = StyleSheet.create({
  // Explicit fill — do NOT use StyleSheet.absoluteFillObject (removed in RN 0.86).
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    elevation: 30,
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Absolute box inset from the bottom by tab-bar clearance so
  // justifyContent:'center' is relative to the usable area, not the
  // physical screen (which includes the tab bar zone).
  main: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 32,
  },
  radar: {
    width: LOGO * 2.6,
    height: LOGO * 2.6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ring: {
    position: 'absolute',
    width: LOGO,
    height: LOGO,
    borderRadius: LOGO / 2,
    borderWidth: 2,
  },
  logoWrap: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  logo: {
    width: LOGO,
    height: LOGO,
    borderRadius: 28,
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  actionDock: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 31,
  },
  cancelBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cancelLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default NearbyScanOverlay;
