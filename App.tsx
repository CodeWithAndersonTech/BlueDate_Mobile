/**
 * BlueDate — React Native app with backend locale/device bootstrap.
 *
 * @format
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { LocaleProvider } from './src/i18n';
import {
  AuthProvider,
  ChatProvider,
  DeviceInsetsGate,
  NotificationsProvider,
  RootNavigator,
} from './src/navigation';
import { ThemeProvider } from './src/theme';
import { hydrateApiLanguageCode } from './src/api/languageHeader';
import { initPushNotifications } from './src/services/push';
import { breadcrumb } from './src/utils/crashLog';

void hydrateApiLanguageCode();

function App() {
  React.useEffect(() => {
    breadcrumb('app_mounted');
    void initPushNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <DeviceInsetsGate />
        <ErrorBoundary>
          <ThemeProvider initialPreference="dark" initialAccent="cosmic">
            <LocaleProvider>
              <AuthProvider>
                <ChatProvider>
                  <NotificationsProvider>
                    <RootNavigator />
                  </NotificationsProvider>
                </ChatProvider>
              </AuthProvider>
            </LocaleProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
