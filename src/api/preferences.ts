import { API_PATHS } from '../config/api';
import { ApiError, apiRequest, ApiEnvelope } from './client';

export type UserPreference = {
  ghostMode: boolean;
  ghostModeActive: boolean;
  ghostAvailable: boolean;
  notifyNearby: boolean;
};

type PreferenceResponse = ApiEnvelope & { preference?: UserPreference };

const DEFAULT_PREFERENCE: UserPreference = {
  ghostMode: false,
  ghostModeActive: false,
  ghostAvailable: false,
  notifyNearby: true,
};

export async function getUserPreference(): Promise<UserPreference> {
  const res = await apiRequest<PreferenceResponse>(API_PATHS.userPreference);
  return { ...DEFAULT_PREFERENCE, ...res.preference };
}

export async function updateUserPreference(
  patch: Partial<Pick<UserPreference, 'ghostMode' | 'notifyNearby'>>,
): Promise<UserPreference> {
  const res = await apiRequest<PreferenceResponse>(API_PATHS.userPreference, {
    method: 'PUT',
    body: { GhostMode: patch.ghostMode, NotifyNearby: patch.notifyNearby },
  });
  if (!res.IsSuccess) {
    throw new ApiError(400, res.ErrorMessage ?? []);
  }
  return { ...DEFAULT_PREFERENCE, ...res.preference };
}
