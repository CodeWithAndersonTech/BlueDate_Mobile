import { API_PATHS, getApiBaseUrl } from '../config/api';
import { apiRequest, ApiEnvelope, ApiError } from './client';
import { getApiLanguageCode } from './languageHeader';
import { resolveMediaUrl } from './photos';

export type StoryMediaType = 'photo' | 'video';

export type StoryItem = {
  Id: number;
  UserId: number;
  MediaUrl: string;
  MediaType: StoryMediaType;
  Caption?: string | null;
  CreatedDate: string;
  ExpiresAt: string;
};

export type StoryUser = {
  UserId: number;
  FirstName: string;
  LastName: string;
  Username: string;
  ProfileImage?: string | null;
};

export type StoryUserGroup = {
  User: StoryUser;
  Stories: StoryItem[];
};

export type StoryFeedResponse = ApiEnvelope & {
  UserId: number;
  Items: StoryUserGroup[];
};

export type CreateStoryResponse = ApiEnvelope & {
  Id: number;
  MediaUrl: string;
  MediaType: StoryMediaType;
  Caption?: string | null;
  CreatedDate: string;
  ExpiresAt: string;
};

type RawStoryItem = {
  Id?: number;
  id?: number;
  UserId?: number;
  userId?: number;
  MediaUrl?: string;
  mediaUrl?: string;
  MediaType?: string;
  mediaType?: string;
  Caption?: string | null;
  caption?: string | null;
  CreatedDate?: string;
  createdDate?: string;
  ExpiresAt?: string;
  expiresAt?: string;
};

type RawUser = {
  UserId?: number;
  userId?: number;
  FirstName?: string;
  firstName?: string;
  LastName?: string;
  lastName?: string;
  Username?: string;
  username?: string;
  ProfileImage?: string | null;
  profileImage?: string | null;
};

type RawGroup = {
  User?: RawUser;
  user?: RawUser;
  Stories?: RawStoryItem[];
  stories?: RawStoryItem[];
};

function normalizeStoryItem(item: RawStoryItem): StoryItem {
  const mediaTypeRaw = String(item.MediaType ?? item.mediaType ?? 'photo').toLowerCase();
  return {
    Id: Number(item.Id ?? item.id ?? 0),
    UserId: Number(item.UserId ?? item.userId ?? 0),
    MediaUrl: String(item.MediaUrl ?? item.mediaUrl ?? ''),
    MediaType: mediaTypeRaw === 'video' ? 'video' : 'photo',
    Caption: item.Caption ?? item.caption ?? null,
    CreatedDate: String(item.CreatedDate ?? item.createdDate ?? ''),
    ExpiresAt: String(item.ExpiresAt ?? item.expiresAt ?? ''),
  };
}

function normalizeUser(user: RawUser | undefined): StoryUser {
  return {
    UserId: Number(user?.UserId ?? user?.userId ?? 0),
    FirstName: String(user?.FirstName ?? user?.firstName ?? ''),
    LastName: String(user?.LastName ?? user?.lastName ?? ''),
    Username: String(user?.Username ?? user?.username ?? ''),
    ProfileImage: user?.ProfileImage ?? user?.profileImage ?? null,
  };
}

function normalizeGroup(group: RawGroup): StoryUserGroup {
  const stories = (group.Stories ?? group.stories ?? [])
    .map(normalizeStoryItem)
    .filter(s => s.Id > 0 && !!s.MediaUrl);
  return {
    User: normalizeUser(group.User ?? group.user),
    Stories: stories,
  };
}

export async function getStoryFeed(
  userId: number,
  token?: string | null,
): Promise<StoryFeedResponse> {
  const raw = await apiRequest<ApiEnvelope & {
    UserId?: number;
    userId?: number;
    Items?: RawGroup[];
    items?: RawGroup[];
    isSuccess?: boolean;
  }>(API_PATHS.storyFeed, {
    query: { userId },
    token,
  });

  const items = (raw.Items ?? raw.items ?? [])
    .map(normalizeGroup)
    .filter(g => g.User.UserId > 0 && g.Stories.length > 0);

  return {
    IsSuccess: raw.IsSuccess ?? raw.isSuccess ?? true,
    ErrorMessage: raw.ErrorMessage,
    SuccessMessage: raw.SuccessMessage,
    UserId: Number(raw.UserId ?? raw.userId ?? userId),
    Items: items,
  };
}

export async function createStory(
  userId: number,
  asset: { uri: string; fileName?: string; type?: string },
  caption?: string,
  token?: string | null,
): Promise<CreateStoryResponse> {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}${API_PATHS.story}`;
  const form = new FormData();
  form.append('userId', String(userId));
  if (caption?.trim()) {
    form.append('caption', caption.trim());
  }
  form.append('file', {
    uri: asset.uri,
    name: asset.fileName || `story_${Date.now()}.jpg`,
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

  let payload: (ApiEnvelope & {
    Id?: number;
    id?: number;
    MediaUrl?: string;
    mediaUrl?: string;
    MediaType?: string;
    mediaType?: string;
    Caption?: string | null;
    caption?: string | null;
    CreatedDate?: string;
    createdDate?: string;
    ExpiresAt?: string;
    expiresAt?: string;
    isSuccess?: boolean;
  }) | null = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const id = Number(payload?.Id ?? payload?.id ?? 0);
  const mediaUrl = String(payload?.MediaUrl ?? payload?.mediaUrl ?? '');
  const ok =
    response.ok &&
    !!payload &&
    (payload.IsSuccess ?? payload.isSuccess ?? true) &&
    id > 0 &&
    !!mediaUrl;

  if (!ok || !payload) {
    throw new ApiError(
      response.status,
      payload?.ErrorMessage?.filter(Boolean) ?? ['Story upload failed'],
    );
  }

  const mediaTypeRaw = String(payload.MediaType ?? payload.mediaType ?? 'photo').toLowerCase();
  return {
    IsSuccess: true,
    ErrorMessage: payload.ErrorMessage,
    SuccessMessage: payload.SuccessMessage,
    Id: id,
    MediaUrl: mediaUrl,
    MediaType: mediaTypeRaw === 'video' ? 'video' : 'photo',
    Caption: payload.Caption ?? payload.caption ?? null,
    CreatedDate: String(payload.CreatedDate ?? payload.createdDate ?? ''),
    ExpiresAt: String(payload.ExpiresAt ?? payload.expiresAt ?? ''),
  };
}

export function deleteStory(
  userId: number,
  storyId: number,
  token?: string | null,
) {
  return apiRequest<ApiEnvelope & { Id: number }>(API_PATHS.storyById(storyId), {
    method: 'DELETE',
    query: { userId },
    token,
  });
}

export async function resolveStoryMediaUrls(
  groups: StoryUserGroup[],
): Promise<StoryUserGroup[]> {
  return Promise.all(
    groups.map(async group => {
      const profileImage = await resolveMediaUrl(group.User.ProfileImage);
      const stories = await Promise.all(
        group.Stories.map(async story => ({
          ...story,
          MediaUrl: (await resolveMediaUrl(story.MediaUrl)) ?? story.MediaUrl,
        })),
      );
      return {
        User: {
          ...group.User,
          ProfileImage: profileImage ?? group.User.ProfileImage,
        },
        Stories: stories,
      };
    }),
  );
}
