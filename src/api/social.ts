import { API_PATHS } from '../config/api';
import { apiRequest, ApiEnvelope } from './client';

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
};

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
  Relation: number;
  StatusId?: number | null;
  StatusCode?: string | null;
  StatusName?: string | null;
};

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
};

export type SocialActivityItem = {
  Type: 'like' | 'friend_request' | string;
  EntityId: number;
  CreatedDate: string;
  User: SocialUser;
};

export type SocialActivityResponse = ApiEnvelope & {
  UserId: number;
  Items: SocialActivityItem[];
};

export type SearchUsersResponse = ApiEnvelope & {
  Items: SocialUser[];
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

export function getFriendshipStatus(
  userId: number,
  otherUserId: number,
  token?: string | null,
) {
  return apiRequest<FriendshipStatusResponse>(API_PATHS.friendshipStatus, {
    query: { userId, otherUserId },
    token,
  });
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

export function getLikeCount(userId: number, token?: string | null) {
  return apiRequest<LikeCountResponse>(API_PATHS.userLikeCount, {
    query: { userId },
    token,
  });
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
