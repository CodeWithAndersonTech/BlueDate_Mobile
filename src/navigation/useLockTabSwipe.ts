import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';

type TabNav = { setOptions: (options: { swipeEnabled: boolean }) => void };

/** How many focused nested screens currently want tab swipe disabled. */
let swipeLockCount = 0;

function applySwipeLock(tabNav: TabNav) {
  try {
    tabNav.setOptions({ swipeEnabled: swipeLockCount === 0 });
  } catch {
    // Navigator may already be tearing down during a page transition.
  }
}

function acquireSwipeLock(tabNav: TabNav) {
  swipeLockCount += 1;
  applySwipeLock(tabNav);
}

function releaseSwipeLock(tabNav: TabNav) {
  swipeLockCount = Math.max(0, swipeLockCount - 1);
  applySwipeLock(tabNav);
}

/**
 * Disables Material Top Tabs horizontal paging while a nested stack screen
 * is focused. Prevents iOS edge-swipe / horizontal drag from switching tabs
 * (e.g. Profile → Premium) instead of popping the stack.
 *
 * Ref-counted + focus/blur aware so overlapping nested screens and pager
 * transitions do not leave swipe stuck or race UIKit appearance callbacks.
 */
export function useLockTabSwipe() {
  const navigation = useNavigation();

  useEffect(() => {
    const tabNav = navigation.getParent() as TabNav | undefined;
    if (!tabNav) {
      return;
    }

    let held = false;
    const lock = () => {
      if (held) return;
      held = true;
      acquireSwipeLock(tabNav);
    };
    const unlock = () => {
      if (!held) return;
      held = false;
      releaseSwipeLock(tabNav);
    };

    const unsubFocus = navigation.addListener('focus', lock);
    const unsubBlur = navigation.addListener('blur', unlock);

    if (navigation.isFocused()) {
      lock();
    }

    return () => {
      unsubFocus();
      unsubBlur();
      unlock();
    };
  }, [navigation]);
}
