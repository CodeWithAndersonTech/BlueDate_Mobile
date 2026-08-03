import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';

/**
 * Disables Material Top Tabs horizontal paging while a nested stack screen
 * is focused. Prevents iOS edge-swipe / horizontal drag from switching tabs
 * (e.g. Profile → Premium) instead of popping the stack.
 */
export function useLockTabSwipe() {
  const navigation = useNavigation();

  useEffect(() => {
    const tabNav = navigation.getParent();
    if (!tabNav) {
      return;
    }

    tabNav.setOptions({ swipeEnabled: false });
    return () => {
      tabNav.setOptions({ swipeEnabled: true });
    };
  }, [navigation]);
}
