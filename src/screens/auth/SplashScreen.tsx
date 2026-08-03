import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { images } from '../../assets';
import { Typography } from '../../components';
import { useTheme } from '../../theme';

export function SplashScreen() {
  const theme = useTheme();
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 140 });
    opacity.value = withTiming(1, { duration: 500 });
    textOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
  }, [opacity, scale, textOpacity]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundAlt, theme.colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.center}>
        <Animated.View style={[logoStyle, theme.shadows.glow]}>
          <Image source={images.appLogo} style={styles.logo} />
        </Animated.View>

        <Animated.View style={[styles.titleWrap, textStyle]}>
          <Typography variant="display" align="center">
            Meerk
          </Typography>
          <Typography variant="callout" color="textMuted" align="center">
            Yeni bağlantılar burada başlar
          </Typography>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: 28 },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 28,
  },
  titleWrap: { alignItems: 'center', gap: 6 },
});

export default SplashScreen;
