/**
 * BlueDate — React Native (bare CLI) UI/UX preview.
 * Phase 1: front-end screens only. No backend / API is wired up yet.
 *
 * @format
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, RootNavigator } from './src/navigation';
import { ThemeProvider } from './src/theme';

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider initialPreference="dark" initialAccent="cosmic">
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
