import {
  NavigationContainer,
  NavigationState,
  PartialState,
} from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
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
  const { status, isSignedIn, signOut } = useAuth();
  const { ready, needsOnboarding, accountGone, refresh } = useOnboardingGate();
  const [splashGaveUp, setSplashGaveUp] = useState(false);

  const onOnboardingCompleted = useCallback(() => {
    void refresh();
  }, [refresh]);

  const showSplash =
    !splashGaveUp && (status === 'bootstrapping' || (isSignedIn && !ready));

  useEffect(() => {
    if (status === 'bootstrapping' || !isSignedIn) {
      setSplashGaveUp(false);
      return;
    }
    if (showSplash) {
      const timer = setTimeout(() => setSplashGaveUp(true), 3500);
      return () => clearTimeout(timer);
    }
    setSplashGaveUp(true);
  }, [showSplash, status, isSignedIn]);

  useEffect(() => {
    if (accountGone) {
      void signOut();
    }
  }, [accountGone, signOut]);

  return (
    <NavigationContainer
      theme={toNavigationTheme(theme)}
      onStateChange={state => {
        breadcrumb('nav', { route: activeRouteName(state) });
      }}>
      {showSplash ? (
        <SplashScreen />
      ) : !isSignedIn || accountGone ? (
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
