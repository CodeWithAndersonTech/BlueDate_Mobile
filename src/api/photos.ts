import { API_PATHS, getApiBaseUrl } from '../config/api';
import { apiRequest, ApiEnvelope, ApiError } from './client';
import { getApiLanguageCode } from './languageHeader';

export const UserPhotoKind = {
  Gallery: 0,
  Avatar: 1,
} as const;

export type UserPhotoItem = {
  Id: number;
  Url: string;
  Kind: number;
  SortOrder: number;
  CreatedDate?: string;
};

export type UserPhotosResponse = ApiEnvelope & {
  UserId: number;
  Items: UserPhotoItem[];
};

export type UploadPhotoResponse = ApiEnvelope & {
  Id: number;
  Url: string;
  SortOrder?: number;
};

type RawPhotoItem = {
  Id?: number;
  id?: number;
  Url?: string;
  url?: string;
  Kind?: number;
  kind?: number;
  SortOrder?: number;
  sortOrder?: number;
  CreatedDate?: string;
  createdDate?: string;
};

type RawPhotosResponse = ApiEnvelope & {
  UserId?: number;
  userId?: number;
  Items?: RawPhotoItem[];
  items?: RawPhotoItem[];
  isSuccess?: boolean;
};

type RawUploadResponse = ApiEnvelope & {
  Id?: number;
  id?: number;
  Url?: string;
  url?: string;
  SortOrder?: number;
  sortOrder?: number;
  isSuccess?: boolean;
};

function normalizePhotoItem(item: RawPhotoItem): UserPhotoItem {
  return {
    Id: Number(item.Id ?? item.id ?? 0),
    Url: String(item.Url ?? item.url ?? ''),
    Kind: Number(item.Kind ?? item.kind ?? 0),
    SortOrder: Number(item.SortOrder ?? item.sortOrder ?? 0),
    CreatedDate: item.CreatedDate ?? item.createdDate,
  };
}

function normalizePhotosResponse(raw: RawPhotosResponse): UserPhotosResponse {
  const items = raw.Items ?? raw.items ?? [];
  return {
    IsSuccess: raw.IsSuccess ?? raw.isSuccess ?? true,
    ErrorMessage: raw.ErrorMessage,
    SuccessMessage: raw.SuccessMessage,
    UserId: Number(raw.UserId ?? raw.userId ?? 0),
    Items: items.map(normalizePhotoItem).filter(item => item.Id > 0 && !!item.Url),
  };
}

function normalizeUploadResponse(raw: RawUploadResponse): UploadPhotoResponse {
  return {
    IsSuccess: raw.IsSuccess ?? raw.isSuccess ?? true,
    ErrorMessage: raw.ErrorMessage,
    SuccessMessage: raw.SuccessMessage,
    Id: Number(raw.Id ?? raw.id ?? 0),
    Url: String(raw.Url ?? raw.url ?? ''),
    SortOrder: Number(raw.SortOrder ?? raw.sortOrder ?? 0),
  };
}

export async function getUserPhotos(
  userId: number,
  kind?: number,
  token?: string | null,
): Promise<UserPhotosResponse> {
  const raw = await apiRequest<RawPhotosResponse>(API_PATHS.userPhotosByUser, {
    query: { userId, kind },
    token,
  });
  return normalizePhotosResponse(raw);
}

export async function resolveMediaUrl(pathOrUrl?: string | null): Promise<string | undefined> {
  if (!pathOrUrl) return undefined;
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('file://') ||
    pathOrUrl.startsWith('content://') ||
    pathOrUrl.startsWith('ph://')
  ) {
    return pathOrUrl;
  }
  const base = await getApiBaseUrl();
  if (pathOrUrl.startsWith('/')) {
    return `${base}${pathOrUrl}`;
  }
  return `${base}/${pathOrUrl}`;
}

async function uploadMultipart(
  path: string,
  userId: number,
  asset: { uri: string; fileName?: string; type?: string },
  token?: string | null,
): Promise<UploadPhotoResponse> {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}${path}`;
  const form = new FormData();
  form.append('userId', String(userId));
  form.append('file', {
    uri: asset.uri,
    name: asset.fileName || `photo_${Date.now()}.jpg`,
    type: asset.type || 'image/jpeg',
  } as unknown as Blob);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Language-Code': getApiLanguageCode(),
    'Accept-Language': getApiLanguageCode(),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, { method: 'POST', headers, body: form });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed';
    throw new ApiError(0, [
      `Backend'e ulaşılamadı (${baseUrl}). ${message}`,
    ]);
  }

  let payload: RawUploadResponse | null = null;
  try {
    payload = (await response.json()) as RawUploadResponse;
  } catch {
    payload = null;
  }

  const normalized = payload ? normalizeUploadResponse(payload) : null;
  const ok =
    response.ok &&
    !!normalized &&
    (normalized.IsSuccess ?? true) &&
    normalized.Id > 0 &&
    !!normalized.Url;

  if (!ok || !normalized) {
    throw new ApiError(
      response.status,
      payload?.ErrorMessage?.filter(Boolean) ?? ['Upload failed'],
    );
  }

  return normalized;
}

export function uploadGalleryPhoto(
  userId: number,
  asset: { uri: string; fileName?: string; type?: string },
  token?: string | null,
) {
  return uploadMultipart(API_PATHS.userPhotoGallery, userId, asset, token);
}

export function uploadAvatarPhoto(
  userId: number,
  asset: { uri: string; fileName?: string; type?: string },
  token?: string | null,
) {
  return uploadMultipart(API_PATHS.userPhotoAvatar, userId, asset, token);
}

export function deleteUserPhoto(
  userId: number,
  photoId: number,
  token?: string | null,
) {
  return apiRequest<ApiEnvelope & { Id: number }>(API_PATHS.userPhoto, {
    method: 'DELETE',
    query: { userId, photoId },
    token,
  });
}
