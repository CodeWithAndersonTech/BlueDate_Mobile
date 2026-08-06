import { useEffect, useState } from 'react';

type Listener = () => void;

let hideCount = 0;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(listener => listener());
}

export function isTabBarForceHidden() {
  return hideCount > 0;
}

export function subscribeTabBarForceHide(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Hides the floating Custom Tab Bar while `hidden` is true (e.g. story
 * compose / viewer overlays on a tab root screen).
 */
export function useHideTabBar(hidden: boolean) {
  useEffect(() => {
    if (!hidden) {
      return;
    }
    hideCount += 1;
    notify();
    return () => {
      hideCount = Math.max(0, hideCount - 1);
      notify();
    };
  }, [hidden]);
}

/** Subscribe CustomTabBar to force-hide requests. */
export function useTabBarForceHidden() {
  const [forceHidden, setForceHidden] = useState(isTabBarForceHidden);

  useEffect(() => {
    return subscribeTabBarForceHide(() => {
      setForceHidden(isTabBarForceHidden());
    });
  }, []);

  return forceHidden;
}
