import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { HomeScreen } from '../screens/home/HomeScreen';
import { FilterScreen } from '../screens/settings/FilterScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeFeed" component={HomeScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Filter" component={FilterScreen} />
    </Stack.Navigator>
  );
}

export default HomeStack;
