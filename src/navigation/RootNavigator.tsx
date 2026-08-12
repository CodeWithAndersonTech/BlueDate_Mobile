import {
  NavigationContainer,
  NavigationState,
  PartialState,
} from '@react-navigation/native';
import React, { useCallback } from 'react';
import { useOnboardingGate } from '../hooks/useOnboardingGate';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { OnboardingSetupScreen } from '../screens/onboarding/OnboardingSetupScreen';
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
  const { ready, needsOnboarding, refresh } = useOnboardingGate();

  const onOnboardingCompleted = useCallback(() => {
    void refresh();
  }, [refresh]);

  const showSplash =
    status === 'bootstrapping' || (isSignedIn && !ready);

  return (
    <NavigationContainer
      theme={toNavigationTheme(theme)}
      onStateChange={state => {
        breadcrumb('nav', { route: activeRouteName(state) });
      }}>
      {showSplash ? (
        <SplashScreen />
      ) : !isSignedIn ? (
        <AuthStack />
      ) : needsOnboarding ? (
        <OnboardingSetupScreen onCompleted={onOnboardingCompleted} />
      ) : (
        <AppStack />
      )}
    </NavigationContainer>
  );
}

export default RootNavigator;
