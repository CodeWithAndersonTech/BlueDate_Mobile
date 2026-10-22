import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import React, { useEffect, useMemo } from 'react';
import {
  Animated as RNAnimated,
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
import { FigmaIcon, FigmaSvgName, Typography } from '../components';
import { useLocale } from '../i18n';
import { useTheme } from '../theme';
import { useChat } from './ChatContext';
import { TAB_ROOT_SCREENS, useTabBarMetrics } from './tabBarLayout';
import { useTabBarForceHidden } from './useHideTabBar';

// Layout hooks live in ./tabBarLayout (single source of truth for clearance
// math); re-exported here so existing imports keep working.
export {
  FLOATING_TAB_BAR_HEIGHT,
  TAB_ROOT_SCREENS,
  useFloatingTabOffset,
  useScreenBottomPad,
  useStickyDockLayout,
  useTabBarClearance,
} from './tabBarLayout';

const TAB_ICONS: Record<string, FigmaSvgName> = {
  Home: 'tabHome',
  Nearby: 'tabNearby',
  Friends: 'tabFriends',
  Messages: 'tabMessages',
  Profile: 'tabProfile',
};

const TAB_A11Y_KEYS: Record<string, string> = {
  Home: 'tabs.home',
  Nearby: 'tabs.nearby',
  Friends: 'tabs.friends',
  Messages: 'tabs.messages',
  Profile: 'tabs.profile',
};

const SPRING = { damping: 18, stiffness: 200, mass: 0.7 };

function shouldHideTabBar(state: MaterialTopTabBarProps['state']): boolean {
  const route = state.routes[state.index];
  // During pager transitions index can briefly be out of range.
  if (!route) {
    return false;
  }

  const nested = route.state as
    | { index?: number; routes?: { name: string }[] }
    | undefined;

  // Stack has pushed a nested screen (EditProfile, UserProfile, …) — hide.
  if (nested?.routes?.length && (nested.index ?? 0) > 0) {
    return true;
  }

  // Prefer the deepest focused route name (more reliable than raw stack index).
  const focused = getFocusedRouteNameFromRoute(route);
  if (focused) {
    return !TAB_ROOT_SCREENS.has(focused);
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
  const { t } = useLocale();
  const { unreadCount: unreadMessages } = useChat();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const metrics = useTabBarMetrics();
  const forceHidden = useTabBarForceHidden();
  const hide = shouldHideTabBar(state) || forceHidden;

  const bottomInset = Math.max(insets.bottom, 12);
  const totalHeight = metrics.pillHeight + bottomInset;
  const barWidth = layout.width || windowWidth;
  const pillWidth = Math.min(metrics.pillWidth, barWidth - metrics.side * 2);
  const tabCount = state.routes.length;
  const innerWidth = pillWidth - metrics.pillPad * 2;
  const tabWidth = innerWidth / tabCount;
  const indicatorWidth = metrics.indicatorWidth;

  // Must run unconditionally — early return before this caused "fewer hooks".
  const indicatorTranslateX = useMemo(() => {
    if (!position || tabCount <= 1) {
      return null;
    }

    const inputRange = state.routes.map((_, i) => i);
    const outputRange = state.routes.map(
      (_, i) =>
        metrics.pillPad + i * tabWidth + (tabWidth - indicatorWidth) / 2,
    );

    return position.interpolate({
      inputRange,
      outputRange,
      extrapolate: 'clamp',
    });
  }, [metrics.pillPad, position, state.routes, tabCount, tabWidth, indicatorWidth]);

  const staticIndicatorOffset =
    metrics.pillPad +
    state.index * tabWidth +
    (tabWidth - indicatorWidth) / 2;

  // Never unmount the tab bar (return null). Material Top Tabs + UIKit
  // appearance transitions crash when the bar is removed mid page-change
  // (_associatedViewControllerForwardsAppearanceCallbacks).
  return (
    <View
      style={[styles.wrapper, hide && styles.wrapperHidden]}
      pointerEvents={hide ? 'none' : 'box-none'}
      accessibilityElementsHidden={hide}
      importantForAccessibility={hide ? 'no-hide-descendants' : 'auto'}>
      <View
        style={[
          styles.bar,
          { width: barWidth, height: totalHeight, paddingBottom: bottomInset },
        ]}>
        <View
          style={[
            styles.pill,
            {
              width: pillWidth,
              height: metrics.pillHeight,
              borderRadius: metrics.pillRadius,
              backgroundColor: theme.colors.tabBar,
            },
          ]}>
          <RNAnimated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              {
                top: metrics.indicatorTop,
                width: indicatorWidth,
                height: metrics.indicatorHeight,
                borderRadius: metrics.indicatorRadius,
                backgroundColor: theme.colors.tabIndicator,
                transform: [
                  {
                    translateX: indicatorTranslateX ?? staticIndicatorOffset,
                  },
                ],
              },
            ]}
          />

          <View style={[styles.row, { paddingHorizontal: metrics.pillPad }]}>
            {state.routes.map((route, index) => {
              const focused = state.index === index;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (event.defaultPrevented) {
                  return;
                }
                // Always navigate — even when already focused — so nested
                // stacks pop to their root, and tab screens receive the
                // re-tap (scroll-to-top via TabScreenScrollView).
                navigation.navigate(route.name as never);
              };

              return (
                <TabItem
                  key={route.key}
                  focused={focused}
                  iconSize={metrics.iconSize}
                  icon={TAB_ICONS[route.name] ?? 'tabHome'}
                  keepDesignColor={route.name === 'Nearby' && focused}
                  accessibilityLabel={
                    TAB_A11Y_KEYS[route.name]
                      ? t(TAB_A11Y_KEYS[route.name])
                      : route.name
                  }
                  badge={route.name === 'Messages' ? unreadMessages : 0}
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
  icon: FigmaSvgName;
  iconSize: number;
  keepDesignColor?: boolean;
  accessibilityLabel: string;
  badge?: number;
  onPress: () => void;
}

function TabItem({
  focused,
  icon,
  iconSize,
  keepDesignColor = false,
  accessibilityLabel,
  badge = 0,
  onPress,
}: TabItemProps) {
  const theme = useTheme();
  const progress = useSharedValue(focused ? 1 : 0);
  const press = useSharedValue(1);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, SPRING);
  }, [focused, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
    opacity: 1,
  }));

  const iconColor = keepDesignColor
    ? undefined
    : focused
      ? theme.colors.plusCta
      : theme.colors.textMuted;

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
        <FigmaIcon name={icon} size={iconSize} color={iconColor} />
        {badge > 0 ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: theme.colors.danger, borderColor: theme.colors.surface },
            ]}>
            <Typography variant="overline" tint={theme.colors.onPrimary}>
              {badge > 9 ? '9+' : String(badge)}
            </Typography>
          </View>
        ) : null}
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
    backgroundColor: 'transparent',
  },
  wrapperHidden: {
    opacity: 0,
  },
  bar: {
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  pill: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CustomTabBar;
