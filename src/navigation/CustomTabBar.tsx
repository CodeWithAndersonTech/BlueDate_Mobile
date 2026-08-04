import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import React, { useEffect, useMemo } from 'react';
import {
  Animated as RNAnimated,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { images } from '../assets';
import { Icon, IconName } from '../components';
import { useTheme } from '../theme';
import { FLOATING_TAB_BAR_HEIGHT } from './tabBarLayout';

// Layout hooks live in ./tabBarLayout (single source of truth for clearance
// math); re-exported here so existing imports keep working.
export {
  FLOATING_TAB_BAR_HEIGHT,
  useFloatingTabOffset,
  useTabBarClearance,
} from './tabBarLayout';

const TAB_ICONS: Record<string, IconName> = {
  Home: 'home',
  Nearby: 'map-pin',
  Friends: 'users',
  Premium: 'crown',
  Profile: 'user',
};

const TAB_A11Y_LABELS: Record<string, string> = {
  Home: 'Ana Sayfa',
  Nearby: 'Yakındakiler',
  Friends: 'Arkadaşlar',
  Premium: 'Premium',
  Profile: 'Profil',
};

const SPRING = { damping: 18, stiffness: 200, mass: 0.7 };
const BAR_HEIGHT = FLOATING_TAB_BAR_HEIGHT;
const PILL_MARGIN_H = 20;
const PILL_RADIUS = 34;
const PILL_PADDING_H = 6;
const INDICATOR_INSET = 5;

/** Root screens of each tab stack — tab bar stays visible only on these. */
const TAB_ROOT_SCREENS = new Set([
  'HomeFeed',
  'NearbyMain',
  'FriendsMain',
  'ProfileMain',
  'Premium',
]);

function shouldHideTabBar(state: MaterialTopTabBarProps['state']): boolean {
  const route = state.routes[state.index];
  const nested = route.state as
    | { index?: number; routes?: { name: string }[] }
    | undefined;

  // Stack has pushed a nested screen (EditProfile, Settings, …) — always hide.
  if (nested?.routes?.length && (nested.index ?? 0) > 0) {
    return true;
  }

  if (!nested?.routes?.length) {
    return false;
  }

  const nestedRoute = nested.routes[nested.index ?? 0];
  if (!nestedRoute) {
    return false;
  }
  return !TAB_ROOT_SCREENS.has(nestedRoute.name);
}

/**
 * Floating pill tab bar with a sliding active highlight. Screens swipe via
 * Material Top Tabs pager; the highlight follows the swipe position.
 */
export function CustomTabBar({
  state,
  navigation,
  position,
  layout,
}: MaterialTopTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const hide = shouldHideTabBar(state);

  const bottomInset = Math.max(insets.bottom, 12);
  const totalHeight = BAR_HEIGHT + bottomInset;
  const barWidth = layout.width || windowWidth;
  const pillWidth = barWidth - PILL_MARGIN_H * 2;
  const tabCount = state.routes.length;
  const innerWidth = pillWidth - PILL_PADDING_H * 2;
  const tabWidth = innerWidth / tabCount;
  const indicatorWidth = Math.max(tabWidth - INDICATOR_INSET * 2, 44);

  // Must run unconditionally — early return before this caused "fewer hooks".
  const indicatorTranslateX = useMemo(() => {
    if (!position || tabCount <= 1) {
      return null;
    }

    const inputRange = state.routes.map((_, i) => i);
    const outputRange = state.routes.map(
      (_, i) =>
        PILL_PADDING_H + i * tabWidth + (tabWidth - indicatorWidth) / 2,
    );

    return position.interpolate({
      inputRange,
      outputRange,
      extrapolate: 'clamp',
    });
  }, [position, state.routes, tabCount, tabWidth, indicatorWidth]);

  if (hide) {
    return <View style={styles.hiddenHost} />;
  }

  const staticIndicatorOffset =
    PILL_PADDING_H +
    state.index * tabWidth +
    (tabWidth - indicatorWidth) / 2;

  const pillBackground = theme.isDark
    ? 'rgba(22, 22, 30, 0.92)'
    : 'rgba(255, 255, 255, 0.94)';
  const pillBorder = theme.isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.06)';
  const indicatorBackground = theme.isDark
    ? 'rgba(255, 255, 255, 0.12)'
    : theme.colors.primarySoft;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View
        style={[
          styles.bar,
          { width: barWidth, height: totalHeight, paddingBottom: bottomInset },
        ]}>
        <View
          style={[
            styles.pill,
            theme.shadows.md,
            {
              width: pillWidth,
              backgroundColor: pillBackground,
              borderColor: pillBorder,
            },
          ]}>
          <RNAnimated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              {
                width: indicatorWidth,
                backgroundColor: indicatorBackground,
                transform: [
                  {
                    translateX: indicatorTranslateX ?? staticIndicatorOffset,
                  },
                ],
              },
            ]}
          />

          <View style={styles.row}>
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
                  useAppLogo={route.name === 'Nearby'}
                  accessibilityLabel={
                    TAB_A11Y_LABELS[route.name] ?? route.name
                  }
                  onPress={onPress}
                />
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

interface TabItemProps {
  focused: boolean;
  icon: IconName;
  useAppLogo?: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}

function TabItem({
  focused,
  icon,
  useAppLogo = false,
  accessibilityLabel,
  onPress,
}: TabItemProps) {
  const theme = useTheme();
  const progress = useSharedValue(focused ? 1 : 0);
  const press = useSharedValue(1);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, SPRING);
  }, [focused, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value * (1 + 0.12 * progress.value) }],
    opacity: useAppLogo ? 0.75 + 0.25 * progress.value : 0.5 + 0.5 * progress.value,
  }));

  const iconColor = focused ? theme.colors.text : theme.colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (press.value = withSpring(0.9, SPRING))}
      onPressOut={() => (press.value = withSpring(1, SPRING))}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: focused }}
      style={styles.item}>
      <Animated.View style={iconStyle}>
        {useAppLogo ? (
          <Image
            source={images.appLogo}
            style={[
              styles.appLogo,
              {
                opacity: focused ? 1 : 0.72,
                borderColor: focused
                  ? theme.colors.primary
                  : 'transparent',
              },
            ]}
          />
        ) : (
          <Icon name={icon} size={26} color={iconColor} filled={focused} />
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hiddenHost: {
    height: 0,
    overflow: 'hidden',
  },
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  bar: {
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: PILL_MARGIN_H,
  },
  pill: {
    height: BAR_HEIGHT,
    borderRadius: PILL_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    top: INDICATOR_INSET,
    bottom: INDICATOR_INSET,
    borderRadius: PILL_RADIUS - INDICATOR_INSET,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PILL_PADDING_H,
  },
  item: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appLogo: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1.5,
  },
});

export default CustomTabBar;
