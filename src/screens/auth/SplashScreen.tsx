import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Icon, Typography } from '../../components';
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
        <Animated.View style={logoStyle}>
          <LinearGradient
            colors={theme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.logo, theme.shadows.glow]}>
            <Icon name="heart" size={56} color={theme.colors.onPrimary} filled />
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.titleWrap, textStyle]}>
          <Typography variant="display" align="center">
            BlueDate
          </Typography>
          <Typography variant="callout" color="textMuted" align="center">
            Yeni bağlantılar burada başlar
          </Typography>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator color={theme.colors.primary} />
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
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: { alignItems: 'center', gap: 6 },
  footer: { position: 'absolute', bottom: 64 },
});

export default SplashScreen;
