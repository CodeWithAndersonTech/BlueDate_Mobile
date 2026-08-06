import { API_PATHS } from '../config/api';
import { apiRequest, ApiEnvelope } from './client';
import { resolveMediaUrl } from './photos';

export type SocialUser = {
  UserId: number;
  FirstName: string;
  LastName: string;
  Username: string;
  ProfileImage?: string | null;
  Bio?: string | null;
  IsVerified: boolean;
};

export type FriendshipListItem = {
  FriendshipId: number;
  StatusId: number;
  StatusCode: string;
  StatusName: string;
  CreatedDate: string;
  RespondedDate?: string | null;
  User: SocialUser;
};

export type FriendshipListResponse = ApiEnvelope & {
  UserId: number;
  Items: FriendshipListItem[];
  /** ASP.NET default camelCase when JsonPropertyName is missing. */
  items?: FriendshipListItem[];
};

/** Normalize list payload whether API emits `Items` or `items`. */
export function friendshipItems(
  res: FriendshipListResponse | null | undefined,
): FriendshipListItem[] {
  return res?.Items ?? res?.items ?? [];
}

/** Turn relative `/uploads/...` paths into absolute URLs for Avatar. */
export async function withResolvedAvatar(user: SocialUser): Promise<SocialUser> {
  const raw =
    user.ProfileImage ??
    (user as SocialUser & { profileImage?: string | null }).profileImage;
  const resolved = await resolveMediaUrl(raw);
  return {
    ...user,
    ProfileImage: resolved ?? raw ?? null,
  };
}

export async function resolveFriendshipAvatars(
  items: FriendshipListItem[],
): Promise<FriendshipListItem[]> {
  return Promise.all(
    items.map(async item => ({
      ...item,
      User: await withResolvedAvatar(item.User),
    })),
  );
}

export type FriendshipActionResponse = ApiEnvelope & {
  Id: number;
  StatusId?: number;
  StatusCode?: string;
};

/** Matches backend FriendshipRelation enum. */
export const FriendshipRelation = {
  None: 0,
  PendingOutgoing: 1,
  PendingIncoming: 2,
  Friends: 3,
  Rejected: 4,
  Cancelled: 5,
} as const;

export type FriendshipStatusResponse = ApiEnvelope & {
  FriendshipId?: number | null;
  friendshipId?: number | null;
  Relation?: number;
  relation?: number;
  StatusId?: number | null;
  statusId?: number | null;
  StatusCode?: string | null;
  statusCode?: string | null;
  StatusName?: string | null;
  statusName?: string | null;
};

/** Normalize camelCase/PascalCase friendship-status payloads. */
export function normalizeFriendshipStatus(
  res: FriendshipStatusResponse | null | undefined,
): {
  FriendshipId: number | null;
  Relation: number;
  StatusId: number | null;
  StatusCode: string | null;
  StatusName: string | null;
} {
  return {
    FriendshipId: res?.FriendshipId ?? res?.friendshipId ?? null,
    Relation: res?.Relation ?? res?.relation ?? FriendshipRelation.None,
    StatusId: res?.StatusId ?? res?.statusId ?? null,
    StatusCode: res?.StatusCode ?? res?.statusCode ?? null,
    StatusName: res?.StatusName ?? res?.statusName ?? null,
  };
}

export type LikeActionResponse = ApiEnvelope & {
  Id: number;
};

export type LikeStatusResponse = ApiEnvelope & {
  HasLiked: boolean;
  LikeId?: number | null;
};

export type LikeCountResponse = ApiEnvelope & {
  UserId: number;
  Count: number;
  count?: number;
  userId?: number;
};

export function likeCountFromResponse(
  res: LikeCountResponse | { Count?: number; count?: number } | null | undefined,
): number {
  const n = Number(res?.Count ?? res?.count ?? 0);
  return Number.isFinite(n) && n > 0 ? n : Math.max(0, n);
}

export type SocialActivityItem = {
  Type: 'like' | 'friend_request' | string;
  EntityId: number;
  CreatedDate: string;
  User: SocialUser;
};

export type SocialActivityResponse = ApiEnvelope & {
  UserId: number;
  Items: SocialActivityItem[];
  items?: SocialActivityItem[];
};

export type SearchUsersResponse = ApiEnvelope & {
  Items: SocialUser[];
  items?: SocialUser[];
};

export function displayName(user: SocialUser) {
  const name = `${user.FirstName ?? ''} ${user.LastName ?? ''}`.trim();
  return name || user.Username || '?';
}

export function getFriends(userId: number, token?: string | null) {
  return apiRequest<FriendshipListResponse>(API_PATHS.friendshipFriends, {
    query: { userId },
    token,
  });
}

export function getIncomingFriendRequests(
  userId: number,
  token?: string | null,
) {
  return apiRequest<FriendshipListResponse>(API_PATHS.friendshipIncoming, {
    query: { userId },
    token,
  });
}

export function getSentFriendRequests(userId: number, token?: string | null) {
  return apiRequest<FriendshipListResponse>(API_PATHS.friendshipSent, {
    query: { userId },
    token,
  });
}

export async function getFriendshipStatus(
  userId: number,
  otherUserId: number,
  token?: string | null,
): Promise<FriendshipStatusResponse & ReturnType<typeof normalizeFriendshipStatus>> {
  const raw = await apiRequest<FriendshipStatusResponse>(
    API_PATHS.friendshipStatus,
    {
      query: { userId, otherUserId },
      token,
    },
  );
  const normalized = normalizeFriendshipStatus(raw);
  return { ...raw, ...normalized };
}

export function sendFriendRequest(
  requesterId: number,
  addresseeId: number,
  token?: string | null,
) {
  return apiRequest<FriendshipActionResponse>(API_PATHS.friendshipRequest, {
    method: 'POST',
    body: { RequesterId: requesterId, AddresseeId: addresseeId },
    token,
  });
}

export function acceptFriendRequest(
  userId: number,
  friendshipId: number,
  token?: string | null,
) {
  return apiRequest<FriendshipActionResponse>(API_PATHS.friendshipAccept, {
    method: 'POST',
    body: { UserId: userId, FriendshipId: friendshipId },
    token,
  });
}

export function rejectFriendRequest(
  userId: number,
  friendshipId: number,
  token?: string | null,
) {
  return apiRequest<FriendshipActionResponse>(API_PATHS.friendshipReject, {
    method: 'POST',
    body: { UserId: userId, FriendshipId: friendshipId },
    token,
  });
}

export function cancelFriendRequest(
  userId: number,
  friendshipId: number,
  token?: string | null,
) {
  return apiRequest<FriendshipActionResponse>(API_PATHS.friendshipCancel, {
    method: 'POST',
    body: { UserId: userId, FriendshipId: friendshipId },
    token,
  });
}

export function unfriend(
  userId: number,
  otherUserId: number,
  token?: string | null,
) {
  return apiRequest<FriendshipActionResponse>(API_PATHS.friendshipUnfriend, {
    method: 'POST',
    body: { UserId: userId, OtherUserId: otherUserId },
    token,
  });
}

export function likeUser(
  likerId: number,
  likedId: number,
  token?: string | null,
) {
  return apiRequest<LikeActionResponse>(API_PATHS.userLike, {
    method: 'POST',
    body: { LikerId: likerId, LikedId: likedId },
    token,
  });
}

export function unlikeUser(
  likerId: number,
  likedId: number,
  token?: string | null,
) {
  return apiRequest<LikeActionResponse>(API_PATHS.userLike, {
    method: 'DELETE',
    query: { likerId, likedId },
    token,
  });
}

export function getLikeStatus(
  likerId: number,
  likedId: number,
  token?: string | null,
) {
  return apiRequest<LikeStatusResponse>(API_PATHS.userLikeStatus, {
    query: { likerId, likedId },
    token,
  });
}

export async function getLikeCount(userId: number, token?: string | null) {
  const raw = await apiRequest<LikeCountResponse>(API_PATHS.userLikeCount, {
    query: { userId },
    token,
  });
  return {
    ...raw,
    UserId: Number(raw.UserId ?? raw.userId ?? userId),
    Count: likeCountFromResponse(raw),
  };
}

export function getSocialActivity(
  userId: number,
  take = 30,
  token?: string | null,
) {
  return apiRequest<SocialActivityResponse>(API_PATHS.socialActivity, {
    query: { userId, take },
    token,
  });
}

export function searchUsers(
  currentUserId: number,
  query: string,
  take = 30,
  token?: string | null,
) {
  return apiRequest<SearchUsersResponse>(API_PATHS.userSearch, {
    query: { currentUserId, query, take },
    token,
  });
}

export function formatRelativeTime(iso: string | undefined | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}
