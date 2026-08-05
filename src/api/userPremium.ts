import { API_PATHS } from '../config/api';
import { apiRequest, ApiEnvelope } from './client';

export type UserPremium = {
  userId: number;
  isPremium: boolean;
  planCode: string | null;
  purchasedAt: string | null;
  expiresAt: string | null;
  daysRemaining: number | null;
  features: string[];
  source: string | null;
};

type RawPremium = {
  UserId?: number;
  userId?: number;
  IsPremium?: boolean;
  isPremium?: boolean;
  PlanCode?: string | null;
  planCode?: string | null;
  PurchasedAt?: string | null;
  purchasedAt?: string | null;
  ExpiresAt?: string | null;
  expiresAt?: string | null;
  DaysRemaining?: number | null;
  daysRemaining?: number | null;
  Features?: string[];
  features?: string[];
  Source?: string | null;
  source?: string | null;
};

type GetResponse = ApiEnvelope & {
  Premium?: RawPremium | null;
  premium?: RawPremium | null;
};

function fromDto(raw: RawPremium | null | undefined, userId: number): UserPremium {
  if (!raw) {
    return {
      userId,
      isPremium: false,
      planCode: null,
      purchasedAt: null,
      expiresAt: null,
      daysRemaining: null,
      features: [],
      source: null,
    };
  }

  return {
    userId: raw.UserId ?? raw.userId ?? userId,
    isPremium: Boolean(raw.IsPremium ?? raw.isPremium),
    planCode: raw.PlanCode ?? raw.planCode ?? null,
    purchasedAt: raw.PurchasedAt ?? raw.purchasedAt ?? null,
    expiresAt: raw.ExpiresAt ?? raw.expiresAt ?? null,
    daysRemaining: raw.DaysRemaining ?? raw.daysRemaining ?? null,
    features: raw.Features ?? raw.features ?? [],
    source: raw.Source ?? raw.source ?? null,
  };
}

export async function fetchUserPremium(
  userId: number,
  token?: string | null,
): Promise<UserPremium> {
  const response = await apiRequest<GetResponse>(API_PATHS.userPremium, {
    query: { userId },
    token,
  });
  return fromDto(response.Premium ?? response.premium, userId);
}

export function hasPremiumFeature(
  premium: UserPremium | null | undefined,
  feature: string,
): boolean {
  if (!premium?.isPremium) {
    return false;
  }
  return premium.features.some(
    f => f.toLowerCase() === feature.toLowerCase(),
  );
}
