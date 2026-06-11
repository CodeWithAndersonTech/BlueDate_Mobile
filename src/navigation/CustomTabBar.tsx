import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Icon, IconName, Typography } from '../components';
import { useTheme } from '../theme';

const TAB_ICONS: Record<string, IconName> = {
  Home: 'home',
  Nearby: 'map-pin',
  Friends: 'users',
  Premium: 'crown',
  Profile: 'user',
};

const TAB_LABELS: Record<string, string> = {
  Home: 'Ana Sayfa',
  Nearby: 'Yakındakiler',
  Friends: 'Arkadaşlar',
  Premium: 'Premium',
  Profile: 'Profil',
};

const SPRING = { damping: 18, stiffness: 200, mass: 0.7 };
/** How high the bar's top edge peaks in the centre (PS5 "card bottom" curve). */
const CURVE_DEPTH = 24;
/** Height of the icon row area (excluding safe-area + curve). */
const BAR_HEIGHT = 64;

/**
 * PlayStation 5 dashboard inspired tab bar: a full-width dark bar with a gently
 * curved top edge, minimalist white icons and an active item that glows with a
 * vertical light beam plus a revealed label — mirroring the PS5 control center.
 */
export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const bottomInset = Math.max(insets.bottom, 12);
  const totalHeight = BAR_HEIGHT + bottomInset + CURVE_DEPTH;

  // Concave-up corners with a raised centre (∩) — the PS5 focused-card curve.
  const path = `M0,${CURVE_DEPTH} Q${width / 2},0 ${width},${CURVE_DEPTH} L${width},${totalHeight} L0,${totalHeight} Z`;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={{ width, height: totalHeight }}>
        <Svg
          width={width}
          height={totalHeight}
          style={StyleSheet.absoluteFill}
          pointerEvents="none">
          <Path
            d={path}
            fill={theme.colors.tabBar}
            stroke={theme.colors.border}
            strokeWidth={1}
          />
        </Svg>

        <View
          style={[
            styles.row,
            {
              height: BAR_HEIGHT + bottomInset,
              marginTop: CURVE_DEPTH,
              paddingBottom: bottomInset,
            },
          ]}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name as never);
              }
            };

            return (
              <TabItem
                key={route.key}
                focused={focused}
                icon={TAB_ICONS[route.name] ?? 'home'}
                label={TAB_LABELS[route.name] ?? route.name}
                onPress={onPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

interface TabItemProps {
  focused: boolean;
  icon: IconName;
  label: string;
  onPress: () => void;
}

function TabItem({ focused, icon, label, onPress }: TabItemProps) {
  const theme = useTheme();
  const progress = useSharedValue(focused ? 1 : 0);
  const press = useSharedValue(1);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, SPRING);
  }, [focused, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value * (1 + 0.12 * progress.value) }],
    opacity: 0.5 + 0.5 * progress.value,
  }));

  const beamStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scaleY: interpolate(progress.value, [0, 1], [0.4, 1]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.9,
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.6, 1]) }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0, { duration: 160 }),
    transform: [{ translateY: (1 - progress.value) * 4 }],
  }));

  const iconColor = focused ? theme.colors.text : theme.colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (press.value = withSpring(0.88, SPRING))}
      onPressOut={() => (press.value = withSpring(1, SPRING))}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      style={styles.item}>
      {/* Vertical light beam rising behind the active icon */}
      <Animated.View style={[styles.beam, beamStyle]} pointerEvents="none">
        <LinearGradient
          colors={['transparent', theme.colors.primary]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.beamGradient}
        />
      </Animated.View>

      {/* Soft radial-style glow puck under the icon */}
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          { backgroundColor: theme.colors.primarySoft },
          theme.shadows.glow,
        ]}
        pointerEvents="none"
      />

      <Animated.View style={iconStyle}>
        <Icon name={icon} size={26} color={iconColor} filled={focused} />
      </Animated.View>

      <Animated.View style={[styles.labelWrap, labelStyle]} pointerEvents="none">
        <Typography
          variant="overline"
          tint={theme.colors.text}
          numberOfLines={1}
          style={styles.label}>
          {label}
        </Typography>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  item: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  beam: {
    position: 'absolute',
    top: 0,
    width: 30,
    height: '78%',
    alignItems: 'center',
  },
  beamGradient: {
    flex: 1,
    width: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  glow: {
    position: 'absolute',
    top: '14%',
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  labelWrap: {
    position: 'absolute',
    bottom: -2,
    alignItems: 'center',
  },
  label: {
    fontSize: 9,
    letterSpacing: 0.4,
  },
});

export default CustomTabBar;
