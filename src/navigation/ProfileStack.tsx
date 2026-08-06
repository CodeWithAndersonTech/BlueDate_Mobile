import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { FriendsListScreen } from '../screens/profile/FriendsListScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { ChangePasswordScreen } from '../screens/settings/ChangePasswordScreen';
import { FilterScreen } from '../screens/settings/FilterScreen';
import { HelpScreen } from '../screens/settings/HelpScreen';
import { PrivacyScreen } from '../screens/settings/PrivacyScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const nestedOptions = {
  gestureEnabled: true,
  // Full-screen back gesture fights Material Top Tabs pager-view and can
  // corrupt UIKit appearance transitions during tab changes.
  fullScreenGestureEnabled: false,
  animation: 'slide_from_right' as const,
};

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={nestedOptions}
      />
      <Stack.Screen
        name="FriendsList"
        component={FriendsListScreen}
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

export default ProfileStack;
