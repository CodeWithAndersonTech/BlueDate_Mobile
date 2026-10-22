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
  Gender?: number | null;
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
  getAllInterestTypeQueryCommonObject?: InterestTypeItem[];
  GetAllInterestTypeQueryResponseCommonObjectDto?: InterestTypeItem[];
};

export function parseInterestTypes(
  raw: InterestTypesResponse | null | undefined,
): InterestTypeItem[] {
  const list = (raw?.GetAllInterestTypeQueryCommonObject ??
    raw?.getAllInterestTypeQueryCommonObject ??
    raw?.GetAllInterestTypeQueryResponseCommonObjectDto ??
    []) as Array<
    InterestTypeItem & {
      id?: number;
      code?: string;
      keyName?: string | null;
      name?: string;
      sortOrder?: number;
      languageKeyId?: number | null;
    }
  >;
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .filter((item): item is NonNullable<typeof item> => item != null)
    .map(item => ({
      Id: Number(item.Id ?? item.id ?? 0),
      Code: String(item.Code ?? item.code ?? ''),
      KeyName: item.KeyName ?? item.keyName ?? null,
      Name: String(item.Name ?? item.name ?? item.Code ?? item.code ?? ''),
      SortOrder: Number(item.SortOrder ?? item.sortOrder ?? 0),
      LanguageKeyId: item.LanguageKeyId ?? item.languageKeyId ?? null,
    }))
    .filter(item => item.Id > 0)
    .sort((a, b) => a.SortOrder - b.SortOrder || a.Id - b.Id);
}

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

function asList<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === 'object') {
    const wrapped = (value as { $values?: unknown; items?: unknown }).$values
      ?? (value as { items?: unknown }).items;
    if (Array.isArray(wrapped)) {
      return wrapped as T[];
    }
  }
  return [];
}

function asText(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (value == null) {
    return null;
  }
  return String(value);
}

export async function getUserProfile(userId: number, token?: string | null) {
  const raw = await apiRequest<
    UserProfileResponse & {
      id?: number;
      firstName?: string;
      lastName?: string;
      username?: string;
      email?: string;
      bio?: string | null;
      profileImage?: string | null;
      phone?: string | null;
      birthDate?: string | null;
      gender?: number | null;
      age?: number | null;
      isEmailVerified?: boolean;
      isVerified?: boolean;
      interests?: UserProfileInterest[];
      photos?: UserProfilePhoto[];
    }
  >(API_PATHS.userProfile, {
    query: { userId },
    token,
    acceptFailedEnvelope: true,
  });

  try {
    const photos = asList<
      UserProfilePhoto & { id?: number; url?: string; sortOrder?: number }
    >(raw?.Photos ?? raw?.photos).map((item, index) => ({
      Id: Number(item?.Id ?? item?.id ?? 0),
      Url: String(item?.Url ?? item?.url ?? ''),
      SortOrder: item?.SortOrder ?? item?.sortOrder ?? index,
    }));

    const interests = asList<
      UserProfileInterest & {
        id?: number;
        value?: string;
        interestTypeId?: number | null;
        interestTypeCode?: string | null;
        interestTypeName?: string | null;
      }
    >(raw?.Interests ?? raw?.interests).map(item => ({
      Id: Number(item?.Id ?? item?.id ?? 0),
      Value: String(item?.Value ?? item?.value ?? ''),
      InterestTypeId: item?.InterestTypeId ?? item?.interestTypeId ?? null,
      InterestTypeCode: item?.InterestTypeCode ?? item?.interestTypeCode ?? null,
      InterestTypeName: item?.InterestTypeName ?? item?.interestTypeName ?? null,
    }));

    return {
      IsSuccess: raw?.IsSuccess ?? true,
      Id: Number(raw?.Id ?? raw?.id ?? userId),
      FirstName: asText(raw?.FirstName ?? raw?.firstName) ?? '',
      LastName: asText(raw?.LastName ?? raw?.lastName) ?? '',
      Username: asText(raw?.Username ?? raw?.username) ?? '',
      Email: asText(raw?.Email ?? raw?.email) ?? '',
      Bio: asText(raw?.Bio ?? raw?.bio),
      ProfileImage: asText(raw?.ProfileImage ?? raw?.profileImage),
      Phone: asText(raw?.Phone ?? raw?.phone),
      BirthDate: asText(raw?.BirthDate ?? raw?.birthDate),
      Gender: raw?.Gender ?? raw?.gender ?? null,
      Age: typeof raw?.Age === 'number' ? raw.Age : raw?.age ?? null,
      IsEmailVerified: raw?.IsEmailVerified ?? raw?.isEmailVerified ?? false,
      IsVerified: raw?.IsVerified ?? raw?.isVerified ?? false,
      StatusText: asText(raw?.StatusText ?? raw?.statusText),
      StatusExpiresAt: asText(raw?.StatusExpiresAt ?? raw?.statusExpiresAt),
      Interests: interests,
      Photos: photos,
    };
  } catch {
    return {
      IsSuccess: true,
      Id: Number(raw?.Id ?? raw?.id ?? userId),
      FirstName: asText(raw?.FirstName ?? raw?.firstName) ?? '',
      LastName: asText(raw?.LastName ?? raw?.lastName) ?? '',
      Username: asText(raw?.Username ?? raw?.username) ?? '',
      Email: asText(raw?.Email ?? raw?.email) ?? '',
      Bio: null,
      ProfileImage: asText(raw?.ProfileImage ?? raw?.profileImage),
      Interests: [],
      Photos: [],
      IsEmailVerified: false,
      IsVerified: false,
    };
  }
}

/** Nearby / badge: API flag, or interests + photo if the flag is stale. */
export function isProfileReadyForNearby(
  profile: Pick<
    UserProfileResponse,
    'IsVerified' | 'Interests' | 'Photos' | 'ProfileImage'
  >,
  types: InterestTypeItem[],
): boolean {
  if (profile.IsVerified) {
    return true;
  }
  if (types.length === 0) {
    return false;
  }
  const interests = profile.Interests ?? [];
  const interestsComplete = types.every(type =>
    interests.some(
      item =>
        Number(item.InterestTypeId) === Number(type.Id) &&
        (item.Value ?? '').trim().length > 0,
    ),
  );
  const hasPhoto =
    (profile.Photos?.length ?? 0) > 0 ||
    Boolean(profile.ProfileImage?.trim());
  return interestsComplete && hasPhoto;
}

export function updateUserBio(payload: UpdateUserBioRequest, token?: string | null) {
  return apiRequest<UpdateUserBioResponse>(API_PATHS.userBio, {
    method: 'PUT',
    body: payload,
    token,
  });
}

export type UpdateUserBasicsRequest = {
  UserId: number;
  FirstName: string;
  LastName: string;
  Username: string;
  BirthDate: string;
  Gender: number;
};

export type UpdateUserBasicsResponse = ApiEnvelope & {
  UserId: number;
  FirstName: string;
  LastName: string;
  Username: string;
  BirthDate?: string | null;
  Gender?: number | null;
};

export function updateUserBasics(
  payload: UpdateUserBasicsRequest,
  token?: string | null,
) {
  return apiRequest<UpdateUserBasicsResponse>(API_PATHS.userBasics, {
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

/** True only when the signed-in user still exists on the server. */
export async function assertOwnProfileExists(
  userId: number,
  token?: string | null,
): Promise<boolean> {
  if (!userId || !token) {
    return false;
  }
  const raw = await apiRequest<
    ApiEnvelope & { Id?: number; id?: number }
  >(API_PATHS.userProfile, {
    query: { userId },
    token,
  });
  return Number(raw.Id ?? raw.id ?? 0) === userId;
}
