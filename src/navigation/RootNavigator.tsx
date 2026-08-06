import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { useTheme } from '../theme';
import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';
import { useAuth } from './AuthContext';
import { toNavigationTheme } from './navigationTheme';

export function RootNavigator() {
  const theme = useTheme();
  const { status, isSignedIn } = useAuth();

  return (
    <NavigationContainer theme={toNavigationTheme(theme)}>
      {status === 'bootstrapping' ? (
        <SplashScreen />
      ) : isSignedIn ? (
        <AppStack />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

export default RootNavigator;
