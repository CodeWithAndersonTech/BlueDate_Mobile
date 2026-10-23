import { useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

type DeviceInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

const winStart = initialWindowMetrics?.insets;
let capturedInsets: DeviceInsets = {
  top: winStart?.top ?? 0,
  bottom: winStart?.bottom ?? 0,
  left: winStart?.left ?? 0,
  right: winStart?.right ?? 0,
};
const insetListeners = new Set<() => void>();

function rememberDeviceInsets(next: DeviceInsets) {
  if (
    capturedInsets.top === next.top &&
    capturedInsets.bottom === next.bottom &&
    capturedInsets.left === next.left &&
    capturedInsets.right === next.right
  ) {
    return;
  }
  capturedInsets = next;
  insetListeners.forEach(listener => listener());
}

/** Mount under the root SafeAreaProvider, outside native stacks. */
export function DeviceInsetsGate() {
  const live = useSafeAreaInsets();
  useEffect(() => {
    rememberDeviceInsets(live);
  }, [live.top, live.bottom, live.left, live.right]);
  return null;
}

function useCapturedInsets(): DeviceInsets {
  const [value, setValue] = useState(capturedInsets);
  useEffect(() => {
    const onChange = () => setValue(capturedInsets);
    insetListeners.add(onChange);
    return () => {
      insetListeners.delete(onChange);
    };
  }, []);
  return value;
}

/** Figma tab bar is drawn on a 393pt frame. */
const FIGMA_SCREEN_W = 393;
const FIGMA_PILL_H = 45;
const FIGMA_PILL_SIDE = 22;
const FIGMA_PILL_PAD = 10;
const FIGMA_ICON = 24;
const FIGMA_INDICATOR_W = 54;
const FIGMA_INDICATOR_H = 39;
const FIGMA_INDICATOR_TOP = 3;

export type TabBarMetrics = {
  scale: number;
  side: number;
  pillWidth: number;
  pillHeight: number;
  pillRadius: number;
  pillPad: number;
  iconSize: number;
  indicatorWidth: number;
  indicatorHeight: number;
  indicatorRadius: number;
  indicatorTop: number;
};

/** Layout for the floating pill at the current window width. */
export function tabBarMetrics(screenWidth: number): TabBarMetrics {
  const scale = Math.max(1, screenWidth / FIGMA_SCREEN_W);
  const side = Math.round(FIGMA_PILL_SIDE * scale);
  const iconSize = Math.round(FIGMA_ICON * scale * 1.15);
  const pillHeight = iconSize + Math.round(20 * scale);
  const indicatorHeight = Math.round(FIGMA_INDICATOR_H * scale * 1.12);
  return {
    scale,
    side,
    pillWidth: Math.max(280, screenWidth - side * 2),
    pillHeight,
    pillRadius: pillHeight / 2,
    pillPad: Math.round(FIGMA_PILL_PAD * scale),
    iconSize,
    indicatorWidth: Math.round(FIGMA_INDICATOR_W * scale * 1.12),
    indicatorHeight: Math.min(indicatorHeight, pillHeight - 4),
    indicatorRadius: pillHeight / 2,
    indicatorTop: Math.max(2, Math.round(FIGMA_INDICATOR_TOP * scale)),
  };
}

export function useTabBarMetrics(): TabBarMetrics {
  const { width } = useWindowDimensions();
  return tabBarMetrics(width);
}

/** Height of the floating pill itself (safe-area excluded). Figma: 45. */
export const FLOATING_TAB_BAR_HEIGHT = FIGMA_PILL_H;
/** @deprecated Prefer tabBarMetrics(width).pillWidth — kept for existing imports. */
export const TAB_PILL_WIDTH = 350;
export const TAB_PILL_RADIUS = 22;
export const TAB_PILL_PAD = FIGMA_PILL_PAD;
export const TAB_INDICATOR_WIDTH = FIGMA_INDICATOR_W;
export const TAB_INDICATOR_HEIGHT = FIGMA_INDICATOR_H;
export const TAB_INDICATOR_RADIUS = 20;

/** The pill keeps at least this much distance from the physical bottom edge. */
export const MIN_BOTTOM_INSET = 12;
/** iPhone X+ home indicator. Used only when the stack zeros safe-area. */
const IOS_HOME_INDICATOR = 34;
const IPHONE_X_MIN_HEIGHT = 812;

/**
 * Root screens of each tab stack — floating tab bar stays visible only here.
 * Keep in sync with CustomTabBar.
 */
export const TAB_ROOT_SCREENS = new Set([
  'HomeFeed',
  'NearbyMain',
  'FriendsMain',
  'ProfileMain',
  'Messages',
]);

/** Default CTA row height — matches FigmaButton size="md". */
export const DOCK_ACTION_HEIGHT = 54;
/** Top padding inside a sticky dock. */
export const DOCK_PAD_TOP = 12;

/**
 * Real device insets. Native stacks set safeAreaInsets { top:0, bottom:0 }
 * so the island is not padded twice; the hook then reports 0 and docks
 * fall into the home indicator. Always take the max with window metrics.
 */
export function useDeviceSafeInsets() {
  const live = useSafeAreaInsets();
  const root = useCapturedInsets();
  const win = initialWindowMetrics?.insets;
  const { height } = useWindowDimensions();
  const reportedBottom = Math.max(
    live.bottom,
    root.bottom,
    win?.bottom ?? 0,
    MIN_BOTTOM_INSET,
  );
  const bottom =
    reportedBottom > MIN_BOTTOM_INSET
      ? reportedBottom
      : Platform.OS === 'ios' && height >= IPHONE_X_MIN_HEIGHT
        ? IOS_HOME_INDICATOR
        : reportedBottom;
  return {
    top: Math.max(live.top, root.top, win?.top ?? 0),
    bottom,
    left: Math.max(live.left, root.left, win?.left ?? 0),
    right: Math.max(live.right, root.right, win?.right ?? 0),
  };
}

/**
 * Bottom padding so scroll content clears the floating pill tab bar.
 * Only for tab-root screens — nested stack screens hide the tab bar.
 */
export function useTabBarClearance(extra = 16) {
  const insets = useDeviceSafeInsets();
  const { pillHeight } = useTabBarMetrics();
  return pillHeight + insets.bottom + extra;
}

/**
 * Offset from the physical screen bottom to sit sticky UI (CTAs, docks)
 * just above the floating tab pill.
 */
export function useFloatingTabOffset(gap = 12) {
  const insets = useDeviceSafeInsets();
  const { pillHeight } = useTabBarMetrics();
  return pillHeight + insets.bottom + gap;
}

/**
 * Bottom content padding for nested stack screens (tab bar hidden).
 * Use on ScrollView/FlatList contentContainerStyle.
 */
export function useScreenBottomPad(extra = 24) {
  const insets = useDeviceSafeInsets();
  return insets.bottom + extra;
}

/** True when the focused route is a tab root (pill tab bar is visible). */
export function useIsTabRootScreen(): boolean {
  const route = useRoute();
  return TAB_ROOT_SCREENS.has(route.name);
}

export type StickyDockLayout = {
  /** Full window height — useful for debugging / hard constraints. */
  windowHeight: number;
  /** Home-indicator / nav-bar inset (floored to MIN_BOTTOM_INSET). */
  bottomSafe: number;
  /** Status-bar / notch inset. */
  topSafe: number;
  /** Whether the floating tab pill is expected to be on screen. */
  tabBarVisible: boolean;
  /**
   * Extra lift above the physical bottom to clear the floating tab pill.
   * Prefer `bottom: 0` + `paddingBottom: dockBottom + dockPaddingBottom`
   * so the dock background fills the gap and scroll content cannot peek
   * underneath. Do not use as absolute `bottom` alone (leaves a hole).
   */
  dockBottom: number;
  /** Inner paddingBottom inside the dock (home indicator when flush). */
  dockPaddingBottom: number;
  /** Total dock chrome height for a standard 48px CTA row. */
  dockHeight: number;
  /** Scroll content padding so the last item clears the overlay dock. */
  scrollClearance: number;
};

/**
 * Device-aware sticky dock metrics.
 *
 * Rule:
 * - Measure safe-area insets from the device.
 * - If this screen is a tab root, reserve the floating pill height.
 * - If nested (tab bar hidden), dock sits on the physical bottom with
 *   only the home-indicator inset — no phantom gap.
 *
 * Pass `forceAboveTabBar: true` when the dock must clear the pill even on
 * nested screens (Material Top Tabs sometimes still overlays the scene).
 */
export function useStickyDockLayout(
  actionHeight = DOCK_ACTION_HEIGHT,
  options?: { forceAboveTabBar?: boolean },
): StickyDockLayout {
  const insets = useDeviceSafeInsets();
  const { height: windowHeight } = useWindowDimensions();
  const isTabRoot = useIsTabRootScreen();
  const tabBarVisible = options?.forceAboveTabBar ? true : isTabRoot;
  const bottomSafe = insets.bottom;
  const topSafe = insets.top;

  const { pillHeight } = useTabBarMetrics();
  const dockBottom = tabBarVisible ? pillHeight + bottomSafe + 16 : 0;
  const dockPaddingBottom = tabBarVisible ? DOCK_PAD_TOP : bottomSafe;
  // Visual height of the dock chrome (not including absolute offset).
  const dockHeight = DOCK_PAD_TOP + actionHeight + dockPaddingBottom;
  // Scroll must clear both the dock body and its offset above the tab pill.
  const scrollClearance = dockHeight + dockBottom + 16;

  return {
    windowHeight,
    bottomSafe,
    topSafe,
    tabBarVisible,
    dockBottom,
    dockPaddingBottom,
    dockHeight,
    scrollClearance,
  };
}
