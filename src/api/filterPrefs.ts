import { API_PATHS } from '../config/api';
import {
  DEFAULT_FILTER_PREFS,
  FilterPrefs,
  normalizeFilterPrefs,
} from '../services/filters/filterPrefsStore';
import { apiRequest, ApiEnvelope } from './client';

type RawPreference = {
  UserId?: number;
  userId?: number;
  AgeMin?: number;
  ageMin?: number;
  AgeMax?: number;
  ageMax?: number;
  ShowMe?: number[] | string[];
  showMe?: number[] | string[];
  VisibleTo?: number[] | string[];
  visibleTo?: number[] | string[];
  ShowMeMask?: number;
  showMeMask?: number;
  VisibleToMask?: number;
  visibleToMask?: number;
};

type GetResponse = ApiEnvelope & {
  Preference?: RawPreference | null;
  preference?: RawPreference | null;
};

type UpsertResponse = ApiEnvelope & {
  Preference?: RawPreference | null;
  preference?: RawPreference | null;
};

function fromDto(raw?: RawPreference | null): FilterPrefs {
  if (!raw) {
    return {
      ...DEFAULT_FILTER_PREFS,
      showMe: [...DEFAULT_FILTER_PREFS.showMe],
      visibleTo: [...DEFAULT_FILTER_PREFS.visibleTo],
    };
  }
  return normalizeFilterPrefs({
    ageLow: raw.AgeMin ?? raw.ageMin,
    ageHigh: raw.AgeMax ?? raw.ageMax,
    showMe: (raw.ShowMe ?? raw.showMe) as FilterPrefs['showMe'],
    visibleTo: (raw.VisibleTo ?? raw.visibleTo) as FilterPrefs['visibleTo'],
  });
}

export async function fetchFilterPrefs(
  userId: number,
  token?: string | null,
): Promise<FilterPrefs> {
  const response = await apiRequest<GetResponse>(API_PATHS.userFilter, {
    query: { userId },
    token,
  });
  return fromDto(response.Preference ?? response.preference);
}

export async function saveFilterPrefs(
  userId: number,
  prefs: FilterPrefs,
  token?: string | null,
): Promise<FilterPrefs> {
  const normalized = normalizeFilterPrefs(prefs);
  const response = await apiRequest<UpsertResponse>(API_PATHS.userFilter, {
    method: 'PUT',
    token,
    body: {
      UserId: userId,
      AgeMin: normalized.ageLow,
      AgeMax: normalized.ageHigh,
      ShowMe: normalized.showMe,
      VisibleTo: normalized.visibleTo,
    },
  });
  return fromDto(response.Preference ?? response.preference) ?? normalized;
}
