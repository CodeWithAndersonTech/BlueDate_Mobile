import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../navigation/AuthContext';
import { loadProfileCompleteness } from '../services/onboarding/profileCompleteness';

/**
 * After sign-in, blocks the main app until the user has filled every interest
 * category and uploaded at least one profile photo.
 */
export function useOnboardingGate() {
  const { status, isSignedIn, userId, accessToken } = useAuth();
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSignedIn || !userId) {
      setNeedsOnboarding(false);
      setReady(true);
      return;
    }

    try {
      const completeness = await loadProfileCompleteness(userId, accessToken);
      setNeedsOnboarding(!completeness.isComplete);
    } catch {
      // Don't lock returning users out of the app on a transient API error.
      setNeedsOnboarding(false);
    } finally {
      setReady(true);
    }
  }, [isSignedIn, userId, accessToken]);

  useEffect(() => {
    if (status === 'bootstrapping') {
      setReady(false);
      return;
    }
    setReady(false);
    void refresh();
  }, [status, refresh]);

  return { ready, needsOnboarding, refresh };
}
