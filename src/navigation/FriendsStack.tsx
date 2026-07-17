import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { FriendsScreen } from '../screens/friends/FriendsScreen';
import { SearchUsersScreen } from '../screens/friends/SearchUsersScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { FriendsStackParamList } from './types';

const Stack = createNativeStackNavigator<FriendsStackParamList>();

export function FriendsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FriendsMain" component={FriendsScreen} />
      <Stack.Screen name="SearchUsers" component={SearchUsersScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    </Stack.Navigator>
  );
}

export default FriendsStack;
