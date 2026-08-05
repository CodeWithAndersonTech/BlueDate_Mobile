import { useCallback, useEffect, useState } from 'react';
import { fetchUserPremium, UserPremium } from '../api/userPremium';
import { useAuth } from '../navigation/AuthContext';

export function usePremium() {
  const { userId, accessToken, isSignedIn } = useAuth();
  const [premium, setPremium] = useState<UserPremium | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isSignedIn || !userId) {
      setPremium(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const next = await fetchUserPremium(userId, accessToken);
      setPremium(next);
    } catch {
      setPremium({
        userId,
        isPremium: false,
        planCode: null,
        purchasedAt: null,
        expiresAt: null,
        daysRemaining: null,
        features: [],
        source: null,
      });
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
    planCode: premium?.planCode ?? null,
    features: premium?.features ?? [],
    refresh,
  };
}
