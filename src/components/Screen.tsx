import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

/**
 * Content sits just under the notch / Dynamic Island.
 * Figma headers start at y=24; we must still clear the island, but do not
 * stack extra padding on top of the inset (that gap showed on every page).
 */
export function tightTopInset(top: number) {
  return Math.max(6, top - 16);
}

export function useScreenTopPad() {
  const insets = useSafeAreaInsets();
  return tightTopInset(insets.top);
}

function hasEdge(edges: readonly Edge[], edge: Edge) {
  return edges.includes(edge);
}

export interface ScreenProps {
  children: React.ReactNode;
  /** Wrap children in a ScrollView. */
  scroll?: boolean;
  /** Apply default horizontal padding. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  /** Optional background color override. */
  backgroundColor?: string;
}

/**
 * Safe-area aware page container that applies the themed background and (by
 * default) syncs the status bar appearance with the active color mode.
 */
export function Screen({
  children,
  scroll = false,
  padded = false,
  style,
  contentContainerStyle,
  edges = ['top', 'bottom'],
  backgroundColor,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bg = backgroundColor ?? theme.colors.background;

  const pad = theme.components.screen.paddingH;
  const innerStyle = [
    padded ? { paddingHorizontal: pad } : null,
    style,
  ];

  return (
    <View
      style={[
        styles.safe,
        {
          backgroundColor: bg,
          paddingTop: hasEdge(edges, 'top') ? tightTopInset(insets.top) : 0,
          paddingBottom: hasEdge(edges, 'bottom') ? insets.bottom : 0,
          paddingLeft: hasEdge(edges, 'left') ? insets.left : 0,
          paddingRight: hasEdge(edges, 'right') ? insets.right : 0,
        },
      ]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            padded ? { paddingHorizontal: pad } : null,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, innerStyle]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
});

export default Screen;
