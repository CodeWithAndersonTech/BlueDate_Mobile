import { API_PATHS, getApiBaseUrl } from '../config/api';
import { apiRequest, ApiEnvelope, ApiError, genericErrorMessage } from './client';
import { getApiLanguageCode } from './languageHeader';
import { resolveMediaUrlWithBase } from './photos';

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
  const user = normalizeUser(group.User ?? group.user);
  if (user.UserId <= 0) {
    const fromStory = stories.find(s => s.UserId > 0)?.UserId;
    if (fromStory) {
      user.UserId = fromStory;
    }
  }
  return {
    User: user,
    Stories: stories,
  };
}

export function isStoryGroupForUser(
  group: StoryUserGroup,
  userId: number,
): boolean {
  const id = Number(userId);
  return (
    Number(group.User.UserId) === id ||
    group.Stories.some(story => Number(story.UserId) === id)
  );
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

/** Active stories of one user, or null when the viewer has no access. */
export async function getStoriesByUser(
  viewerUserId: number,
  userId: number,
  coords?: { latitude: number; longitude: number } | null,
): Promise<StoryUserGroup | null> {
  try {
    const raw = await apiRequest<ApiEnvelope & RawGroup>(API_PATHS.storyByUser, {
      query: {
        viewerUserId,
        userId,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      },
    });
    const group = normalizeGroup(raw);
    if (group.User.UserId <= 0 || group.Stories.length === 0) return null;
    const [resolved] = await resolveStoryMediaUrls([group]);
    return resolved;
  } catch {
    return null;
  }
}

export type FootprintGroup = StoryUserGroup & { LastSharedAt: string };

export type FootprintsResult = {
  items: FootprintGroup[];
  canOpenProfile: boolean;
  windowHours: number;
};

export async function getFootprints(
  latitude: number,
  longitude: number,
): Promise<FootprintsResult> {
  const raw = await apiRequest<
    ApiEnvelope & {
      items?: (RawGroup & { lastSharedAt?: string })[];
      canOpenProfile?: boolean;
      windowHours?: number;
    }
  >(API_PATHS.storyFootprints, { query: { latitude, longitude } });

  const groups = (raw.items ?? [])
    .map(g => ({ ...normalizeGroup(g), LastSharedAt: String(g.lastSharedAt ?? '') }))
    .filter(g => g.User.UserId > 0 && g.Stories.length > 0);
  const resolved = await resolveStoryMediaUrls(groups);
  return {
    items: resolved.map((g, i) => ({ ...g, LastSharedAt: groups[i].LastSharedAt })),
    canOpenProfile: raw.canOpenProfile ?? false,
    windowHours: raw.windowHours ?? 6,
  };
}

export async function createStory(
  userId: number,
  asset: { uri: string; fileName?: string; type?: string },
  caption?: string,
  token?: string | null,
  coords?: { latitude: number; longitude: number } | null,
): Promise<CreateStoryResponse> {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}${API_PATHS.story}`;
  const form = new FormData();
  form.append('userId', String(userId));
  if (caption?.trim()) {
    form.append('caption', caption.trim());
  }
  if (coords) {
    form.append('latitude', coords.latitude.toFixed(6));
    form.append('longitude', coords.longitude.toFixed(6));
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
  } catch {
    throw new ApiError(0, [genericErrorMessage()]);
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
  const base = await getApiBaseUrl();
  return groups.map(group => ({
    User: {
      ...group.User,
      ProfileImage:
        resolveMediaUrlWithBase(base, group.User.ProfileImage) ??
        group.User.ProfileImage,
    },
    Stories: group.Stories.map(story => ({
      ...story,
      MediaUrl: resolveMediaUrlWithBase(base, story.MediaUrl) ?? story.MediaUrl,
    })),
  }));
}
