import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { FriendsListScreen } from '../screens/profile/FriendsListScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="FriendsList" component={FriendsListScreen} />
    </Stack.Navigator>
  );
}

export default ProfileStack;
