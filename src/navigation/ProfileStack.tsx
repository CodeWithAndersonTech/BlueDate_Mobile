import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { FriendsListScreen } from '../screens/profile/FriendsListScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { FilterScreen } from '../screens/settings/FilterScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const nestedOptions = {
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
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
        name="UserProfile"
        component={UserProfileScreen}
        options={nestedOptions}
      />
    </Stack.Navigator>
  );
}

export default ProfileStack;
