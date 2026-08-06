import {
  NavigationContainer,
  NavigationState,
  PartialState,
} from '@react-navigation/native';
import React from 'react';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { useTheme } from '../theme';
import { breadcrumb } from '../utils/crashLog';
import { AppStack } from './AppStack';
import { AuthStack } from './AuthStack';
import { useAuth } from './AuthContext';
import { toNavigationTheme } from './navigationTheme';

function activeRouteName(
  state?: NavigationState | PartialState<NavigationState>,
): string {
  if (!state || typeof state.index !== 'number') return 'unknown';
  const route = state.routes[state.index];
  if (!route) return 'unknown';
  if (route.state) return activeRouteName(route.state);
  return route.name;
}

export function RootNavigator() {
  const theme = useTheme();
  const { status, isSignedIn } = useAuth();

  return (
    <NavigationContainer
      theme={toNavigationTheme(theme)}
      onStateChange={state => {
        breadcrumb('nav', { route: activeRouteName(state) });
      }}>
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
