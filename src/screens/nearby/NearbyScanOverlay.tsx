import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { FigmaIcon } from '../../components/FigmaIcon';
import { Typography } from '../../components';
import { useLocale } from '../../i18n';
import { useTabBarClearance } from '../../navigation/tabBarLayout';

type Props = {
  visible?: boolean;
};

const RADAR = 250;

/**
 * In-page “Yakındakiler Aranıyor” state from Figma — concentric rings +
 * rotating gold wedge, header stays on the screen above this block.
 */
export function NearbyScanOverlay({ visible = true }: Props) {
  const { t } = useLocale();
  const tabClearance = useTabBarClearance(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      spin.value = 0;
      return;
    }
    spin.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.linear }),
      -1,
      false,
    );
  }, [visible, spin]);

  const wedgeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  if (!visible) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { paddingBottom: tabClearance }]}
      accessibilityRole="progressbar"
      accessibilityLabel={t('nearby.scanning')}>
      <View style={styles.anchor}>
        <View style={styles.radar}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <FigmaIcon name="radarGlow" size={RADAR} />
          </View>
          <Animated.View style={[StyleSheet.absoluteFill, wedgeStyle]} pointerEvents="none">
            <FigmaIcon name="radarC" size={RADAR} />
          </Animated.View>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <FigmaIcon name="radarB" size={RADAR} />
          </View>
          <FigmaIcon name="radarPin" size={30} />
        </View>
        <View style={styles.copy}>
          <Typography variant="h3" align="center" weight="600">
            {t('nearby.scanning')}
          </Typography>
          <Typography variant="caption" align="center">
            {t('nearby.scanning_hint')}
          </Typography>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  anchor: {
    width: RADAR,
    height: RADAR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radar: {
    width: RADAR,
    height: RADAR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    position: 'absolute',
    top: RADAR + 10,
    left: -40,
    right: -40,
    alignItems: 'center',
  },
});

export default NearbyScanOverlay;
