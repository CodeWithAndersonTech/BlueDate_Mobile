import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { HomeScreen } from '../screens/home/HomeScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { ChangePasswordScreen } from '../screens/settings/ChangePasswordScreen';
import { FilterScreen } from '../screens/settings/FilterScreen';
import { HelpScreen } from '../screens/settings/HelpScreen';
import { PrivacyScreen } from '../screens/settings/PrivacyScreen';
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
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="Help"
        component={HelpScreen}
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
