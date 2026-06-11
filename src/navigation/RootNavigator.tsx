import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { useTheme } from '../theme';
import { AuthStack } from './AuthStack';
import { useAuth } from './AuthContext';
import { MainTabs } from './MainTabs';
import { toNavigationTheme } from './navigationTheme';

export function RootNavigator() {
  const theme = useTheme();
  const { status } = useAuth();

  return (
    <NavigationContainer theme={toNavigationTheme(theme)}>
      {status === 'bootstrapping' ? (
        <SplashScreen />
      ) : status === 'signedIn' ? (
        <MainTabs />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

export default RootNavigator;
