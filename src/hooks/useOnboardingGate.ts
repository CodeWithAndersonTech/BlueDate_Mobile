import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { ApiError } from '../api/client';
import { isAccountGoneError } from '../i18n';
import { useAuth } from '../navigation/AuthContext';
import { loadProfileCompleteness } from '../services/onboarding/profileCompleteness';
import { withTimeout } from '../utils/withTimeout';

function isOwnAccountDead(error: unknown): boolean {
  if (isAccountGoneError(error)) {
    return true;
  }
  return (
    error instanceof ApiError &&
    (error.status === 401 || error.status === 403 || error.status === 404)
  );
}

/**
 * After sign-in, blocks the main app until the user has filled every interest
 * category and uploaded at least one profile photo.
 *
 * Completeness is rechecked in the background. Do not flip `ready` off for the
 * same user — that unmounts the whole tree and looks like an app reload.
 */
export function useOnboardingGate() {
  const { status, isSignedIn, userId, accessToken } = useAuth();
  const [checkedUserId, setCheckedUserId] = useState<number | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [accountGone, setAccountGone] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSignedIn || !userId) {
      setNeedsOnboarding(false);
      setAccountGone(false);
      setCheckedUserId(null);
      return;
    }

    try {
      const completeness = await withTimeout(
        loadProfileCompleteness(userId, accessToken),
        4000,
        'onboarding timeout',
      );
      setAccountGone(false);
      setNeedsOnboarding(!completeness.isComplete);
    } catch (error) {
      if (isOwnAccountDead(error)) {
        setAccountGone(true);
        setNeedsOnboarding(false);
      } else {
        setAccountGone(false);
        setNeedsOnboarding(false);
      }
    } finally {
      setCheckedUserId(userId);
    }
  }, [isSignedIn, userId, accessToken]);

  useEffect(() => {
    if (status === 'bootstrapping') {
      return;
    }
    void refresh();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void refresh();
      }
    });
    return () => sub.remove();
  }, [status, refresh]);

  const ready =
    status !== 'bootstrapping' &&
    (!isSignedIn || checkedUserId === userId);

  return { ready, needsOnboarding, accountGone, refresh };
}
