import { useNavigation, useRoute } from '@react-navigation/native';
import React, { forwardRef, useEffect, useRef } from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import { useTabBarClearance } from '../navigation/tabBarLayout';

export interface TabScreenScrollViewProps extends ScrollViewProps {
  /**
   * Extra space between the last content item and the floating tab bar.
   * Screens with sticky bottom UI should pass their dock height here.
   */
  bottomSpacing?: number;
}

/**
 * ScrollView for tab-root screens. Always pads the bottom via
 * contentContainerStyle so the last items scroll clear of the floating
 * pill tab bar (pill height + device safe area included).
 *
 * Re-tapping the active tab scrolls this view back to the top (all tabs).
 */
export const TabScreenScrollView = forwardRef<
  ScrollView,
  TabScreenScrollViewProps
>(function TabScreenScrollView(
  { bottomSpacing = 8, contentContainerStyle, children, ...props },
  forwardedRef,
) {
  const clearance = useTabBarClearance(16);
  const navigation = useNavigation();
  const route = useRoute();
  const localRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    type Nav = typeof navigation;
    const tabNavigations: Nav[] = [];
    let current: Nav | undefined = navigation;
    while (current) {
      try {
        if (current.getState()?.type === 'tab') {
          tabNavigations.push(current);
        }
      } catch {
        // Navigator may be tearing down.
      }
      current = current.getParent();
    }

    if (tabNavigations.length === 0) {
      return;
    }

    const unsubscribers = tabNavigations.map(tab =>
      tab.addListener(
        // Material Top Tabs expose tabPress; state.type is "tab".
        'tabPress' as never,
        ((e: { defaultPrevented: boolean }) => {
          // Wait a frame so stack pop-to-top (same-tab re-tap) settles first.
          requestAnimationFrame(() => {
            if (e.defaultPrevented || !navigation.isFocused()) {
              return;
            }

            try {
              const state = navigation.getState() as
                | {
                    type?: string;
                    index?: number;
                    routes: { key: string }[];
                  }
                | undefined;
              if (
                state?.type === 'stack' &&
                state.routes[state.index ?? 0]?.key !== route.key
              ) {
                // Still on a nested stack screen — don't scroll a buried root.
                return;
              }
            } catch {
              // ignore
            }

            localRef.current?.scrollTo({ y: 0, animated: true });
          });
        }) as never,
      ),
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [navigation, route.key]);

  const setRefs = (node: ScrollView | null) => {
    localRef.current = node;
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  };

  return (
    <ScrollView
      ref={setRefs}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...props}
      contentContainerStyle={[
        contentContainerStyle,
        { paddingBottom: bottomSpacing + clearance },
      ]}>
      {children}
    </ScrollView>
  );
});

export default TabScreenScrollView;
