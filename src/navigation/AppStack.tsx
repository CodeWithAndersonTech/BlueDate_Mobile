import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ChatThreadScreen } from '../screens/messages/ChatThreadScreen';
import { MessagesScreen } from '../screens/messages/MessagesScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { MainTabs } from './MainTabs';
import { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

const overlayOptions = {
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  animation: 'slide_from_right' as const,
};

/**
 * Root signed-in stack. Messages / chat / notifications sit ABOVE the tab
 * navigator so the floating tab bar never steals bottom layout from the
 * composer.
 */
export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
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
    </Stack.Navigator>
  );
}

export default AppStack;
