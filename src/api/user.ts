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
  IsEmailVerified: boolean;
  Interests: UserProfileInterest[];
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

export function getUserProfile(userId: number, token?: string | null) {
  return apiRequest<UserProfileResponse>(API_PATHS.userProfile, {
    query: { userId },
    token,
  });
}

export function updateUserBio(payload: UpdateUserBioRequest, token?: string | null) {
  return apiRequest<UpdateUserBioResponse>(API_PATHS.userBio, {
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
