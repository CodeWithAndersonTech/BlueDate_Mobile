import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { FriendsScreen } from '../screens/friends/FriendsScreen';
import { SearchUsersScreen } from '../screens/friends/SearchUsersScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { FriendsStackParamList } from './types';

const Stack = createNativeStackNavigator<FriendsStackParamList>();

const nestedOptions = {
  gestureEnabled: true,
  fullScreenGestureEnabled: false,
  animation: 'slide_from_right' as const,
};

export function FriendsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FriendsMain" component={FriendsScreen} />
      <Stack.Screen
        name="SearchUsers"
        component={SearchUsersScreen}
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

export default FriendsStack;
