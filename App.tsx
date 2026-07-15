/**
 * BlueDate — React Native app with backend locale/device bootstrap.
 *
 * @format
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocaleProvider } from './src/i18n';
import { AuthProvider, RootNavigator } from './src/navigation';
import { ThemeProvider } from './src/theme';

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider initialPreference="dark" initialAccent="cosmic">
          <LocaleProvider>
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
