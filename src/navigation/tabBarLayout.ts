import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Height of the floating pill itself (safe-area excluded). */
export const FLOATING_TAB_BAR_HEIGHT = 56;

/** The pill keeps at least this much distance from the physical bottom edge. */
const MIN_BOTTOM_INSET = 12;

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
