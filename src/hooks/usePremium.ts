import { useCallback, useEffect, useState } from 'react';
import { fetchUserPremium, isPlusPlan, UserPremium } from '../api/userPremium';
import { useAuth } from '../navigation/AuthContext';

let cached: UserPremium | null = null;
const listeners = new Set<(next: UserPremium | null) => void>();

/** Pushes a fresh premium state (e.g. after a purchase) to every mounted hook. */
export function publishPremium(next: UserPremium | null) {
  cached = next;
  listeners.forEach(fn => fn(next));
}

export function usePremium() {
  const { userId, accessToken, isSignedIn } = useAuth();
  const [premium, setPremium] = useState<UserPremium | null>(
    cached && cached.userId === userId ? cached : null,
  );
  const [loading, setLoading] = useState(premium == null);

  useEffect(() => {
    listeners.add(setPremium);
    return () => {
      listeners.delete(setPremium);
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!isSignedIn || !userId) {
      publishPremium(null);
      setLoading(false);
      return;
    }

    try {
      const next = await fetchUserPremium(userId, accessToken);
      publishPremium(next);
    } catch {
      if (!cached || cached.userId !== userId) {
        publishPremium({
          userId,
          isPremium: false,
          planCode: null,
          purchasedAt: null,
          expiresAt: null,
          daysRemaining: null,
          features: [],
          source: null,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, isSignedIn, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    premium,
    loading,
    isPremium: premium?.isPremium === true,
    isPlus: isPlusPlan(premium),
    planCode: premium?.planCode ?? null,
    features: premium?.features ?? [],
    refresh,
  };
}
