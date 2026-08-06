import { API_PATHS } from '../config/api';
import { apiRequest, ApiEnvelope } from './client';

export type UserProfileInterest = {
  Id: number;
  Value: string;
  InterestTypeId?: number | null;
  InterestTypeCode?: string | null;
  InterestTypeName?: string | null;
};

export type UserProfileResponse = ApiEnvelope & {
  Id: number;
  FirstName: string;
  LastName: string;
  Username: string;
  Email: string;
  Bio?: string | null;
  ProfileImage?: string | null;
  Phone?: string | null;
  BirthDate?: string | null;
  /** Whole years derived from BirthDate. */
  Age?: number | null;
  IsEmailVerified: boolean;
  /** Onaylı hesap — tüm interest type'lar + en az 1 galeri fotoğrafı. */
  IsVerified: boolean;
  /** Active 24h status (text/emoji); null when missing or expired. */
  StatusText?: string | null;
  statusText?: string | null;
  StatusExpiresAt?: string | null;
  statusExpiresAt?: string | null;
  Interests: UserProfileInterest[];
  Photos?: UserProfilePhoto[];
};

export type UserProfilePhoto = {
  Id: number;
  Url: string;
  SortOrder: number;
};

export type InterestTypeItem = {
  Id: number;
  Code: string;
  KeyName?: string | null;
  Name: string;
  SortOrder: number;
  LanguageKeyId?: number | null;
};

export type InterestTypesResponse = ApiEnvelope & {
  GetAllInterestTypeQueryCommonObject?: InterestTypeItem[];
};

export type UserInterestItem = {
  Id: number;
  Value: string;
  InterestTypeId?: number | null;
  InterestTypeCode?: string | null;
};

export type UserInterestsByUserResponse = ApiEnvelope & {
  UserId: number;
  Items: UserInterestItem[];
};

export type SaveUserInterestRequest = {
  UserId: number;
  InterestTypeId: number;
  Value: string;
};

export type SaveUserInterestResponse = ApiEnvelope & {
  Id: number;
};

export type UpdateUserBioRequest = {
  UserId: number;
  Bio: string;
};

export type UpdateUserBioResponse = ApiEnvelope & {
  UserId: number;
  Bio: string;
};

export async function getUserProfile(userId: number, token?: string | null) {
  const raw = await apiRequest<UserProfileResponse>(API_PATHS.userProfile, {
    query: { userId },
    token,
  });
  return {
    ...raw,
    StatusText: raw.StatusText ?? raw.statusText ?? null,
    StatusExpiresAt: raw.StatusExpiresAt ?? raw.statusExpiresAt ?? null,
  };
}

export function updateUserBio(payload: UpdateUserBioRequest, token?: string | null) {
  return apiRequest<UpdateUserBioResponse>(API_PATHS.userBio, {
    method: 'PUT',
    body: payload,
    token,
  });
}

export type UpdateUserStatusRequest = {
  UserId: number;
  StatusText: string;
};

export type UpdateUserStatusResponse = ApiEnvelope & {
  UserId: number;
  StatusText?: string | null;
  StatusExpiresAt?: string | null;
};

export function updateUserStatus(
  payload: UpdateUserStatusRequest,
  token?: string | null,
) {
  return apiRequest<UpdateUserStatusResponse>(API_PATHS.userStatus, {
    method: 'PUT',
    body: payload,
    token,
  });
}

export function getInterestTypes(token?: string | null) {
  return apiRequest<InterestTypesResponse>(API_PATHS.interestTypes, {
    token,
  });
}

export function getUserInterestsByUser(userId: number, token?: string | null) {
  return apiRequest<UserInterestsByUserResponse>(API_PATHS.userInterestsByUser, {
    query: { userId },
    token,
  });
}

export function saveUserInterest(
  payload: SaveUserInterestRequest,
  token?: string | null,
) {
  return apiRequest<SaveUserInterestResponse>(API_PATHS.userInterest, {
    method: 'POST',
    body: payload,
    token,
  });
}

export function deleteUserInterest(id: number, token?: string | null) {
  return apiRequest<ApiEnvelope>(`${API_PATHS.userInterest}/id`, {
    method: 'DELETE',
    query: { id },
    token,
  });
}
