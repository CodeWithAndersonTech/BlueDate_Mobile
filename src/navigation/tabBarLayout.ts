import { useRoute } from '@react-navigation/native';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Height of the floating pill itself (safe-area excluded). */
export const FLOATING_TAB_BAR_HEIGHT = 56;

/** The pill keeps at least this much distance from the physical bottom edge. */
export const MIN_BOTTOM_INSET = 12;

/**
 * Root screens of each tab stack — floating tab bar stays visible only here.
 * Keep in sync with CustomTabBar.
 */
export const TAB_ROOT_SCREENS = new Set([
  'HomeFeed',
  'NearbyMain',
  'FriendsMain',
  'ProfileMain',
  'Premium',
]);

/** Default CTA row height inside a sticky dock (button only). */
export const DOCK_ACTION_HEIGHT = 48;
/** Top padding inside a sticky dock. */
export const DOCK_PAD_TOP = 12;

/**
 * Bottom padding so scroll content clears the floating pill tab bar.
 * Only for tab-root screens — nested stack screens hide the tab bar.
 */
export function useTabBarClearance(extra = 16) {
  const insets = useSafeAreaInsets();
  return (
    FLOATING_TAB_BAR_HEIGHT + Math.max(insets.bottom, MIN_BOTTOM_INSET) + extra
  );
}

/**
 * Offset from the physical screen bottom to sit sticky UI (CTAs, docks)
 * just above the floating tab pill.
 */
export function useFloatingTabOffset(gap = 12) {
  const insets = useSafeAreaInsets();
  return (
    FLOATING_TAB_BAR_HEIGHT + Math.max(insets.bottom, MIN_BOTTOM_INSET) + gap
  );
}

/**
 * Bottom content padding for nested stack screens (tab bar hidden).
 * Use on ScrollView/FlatList contentContainerStyle.
 */
export function useScreenBottomPad(extra = 24) {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, MIN_BOTTOM_INSET) + extra;
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
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const isTabRoot = useIsTabRootScreen();
  const tabBarVisible = options?.forceAboveTabBar ? true : isTabRoot;
  const bottomSafe = Math.max(insets.bottom, MIN_BOTTOM_INSET);
  const topSafe = insets.top;

  const dockBottom = tabBarVisible
    ? FLOATING_TAB_BAR_HEIGHT + bottomSafe + 16
    : 0;
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
