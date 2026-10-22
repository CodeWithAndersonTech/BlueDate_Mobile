import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ChatThreadScreen } from '../screens/messages/ChatThreadScreen';
import { InAppNotificationBanner } from '../screens/notifications/InAppNotificationBanner';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { PremiumScreen } from '../screens/premium/PremiumScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { TreatRequestScreen } from '../screens/treat/TreatRequestScreen';
import { TreatResultScreen } from '../screens/treat/TreatResultScreen';
import { MainTabs } from './MainTabs';
import { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

const overlayOptions = {
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  animation: 'slide_from_right' as const,
};

/**
 * Root signed-in stack. Chat / notifications / premium sit ABOVE the tab
 * navigator so the floating tab bar never steals bottom layout from the
 * composer.
 */
export function AppStack() {
  return (
    <View style={styles.root}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          // Tabs and overlays pad the island themselves. Native stack
          // inset here stacked a second gap above Messages / Nearby.
          safeAreaInsets: { top: 0, bottom: 0 },
        }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="Premium"
          component={PremiumScreen}
          options={overlayOptions}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={overlayOptions}
        />
        <Stack.Screen
          name="ChatThread"
          component={ChatThreadScreen}
          options={overlayOptions}
        />
        <Stack.Screen
          name="UserProfile"
          component={UserProfileScreen}
          options={overlayOptions}
        />
        <Stack.Screen
          name="TreatRequest"
          component={TreatRequestScreen}
          options={overlayOptions}
        />
        <Stack.Screen
          name="TreatResult"
          component={TreatResultScreen}
          options={{ ...overlayOptions, gestureEnabled: false }}
        />
      </Stack.Navigator>
      <InAppNotificationBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default AppStack;
