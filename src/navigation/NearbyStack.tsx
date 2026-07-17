import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { NearbyScreen } from '../screens/nearby/NearbyScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { NearbyStackParamList } from './types';

const Stack = createNativeStackNavigator<NearbyStackParamList>();

export function NearbyStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NearbyMain" component={NearbyScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    </Stack.Navigator>
  );
}

export default NearbyStack;
