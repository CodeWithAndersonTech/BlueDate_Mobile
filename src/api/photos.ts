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

export function getUserPhotos(
  userId: number,
  kind?: number,
  token?: string | null,
) {
  return apiRequest<UserPhotosResponse>(API_PATHS.userPhotosByUser, {
    query: { userId, kind },
    token,
  });
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

  let payload: UploadPhotoResponse | null = null;
  try {
    payload = (await response.json()) as UploadPhotoResponse;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.IsSuccess) {
    throw new ApiError(
      response.status,
      payload?.ErrorMessage?.filter(Boolean) ?? ['Upload failed'],
    );
  }

  return payload;
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
