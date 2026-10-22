import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { MessagesScreen } from '../screens/messages/MessagesScreen';
import { MessagesStackParamList } from './types';

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export function MessagesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        // Screen already applies tightTopInset — native stack inset
        // stacked a second island gap above the Messages header.
        safeAreaInsets: { top: 0, bottom: 0 },
      }}>
      <Stack.Screen name="MessagesMain" component={MessagesScreen} />
    </Stack.Navigator>
  );
}

export default MessagesStack;
