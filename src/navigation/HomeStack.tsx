import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ChatThreadScreen } from '../screens/messages/ChatThreadScreen';
import { MessagesScreen } from '../screens/messages/MessagesScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { FilterScreen } from '../screens/settings/FilterScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const nestedOptions = {
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  animation: 'slide_from_right' as const,
};

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeFeed" component={HomeScreen} />
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="ChatThread"
        component={ChatThreadScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="Filter"
        component={FilterScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={nestedOptions}
      />
    </Stack.Navigator>
  );
}

export default HomeStack;
