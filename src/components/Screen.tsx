import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

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
  const bg = backgroundColor ?? theme.colors.background;

  const innerStyle = [
    padded ? { paddingHorizontal: theme.spacing.lg } : null,
    style,
  ];

  return (
    <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor: bg }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            padded ? { paddingHorizontal: theme.spacing.lg } : null,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, innerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
});

export default Screen;
