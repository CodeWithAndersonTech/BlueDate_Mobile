import { API_PATHS } from '../config/api';
import { apiRequest, ApiEnvelope, ApiError } from './client';
import { resolveMediaUrl } from './photos';

export const REPORT_REASONS = [
  'spam',
  'harassment',
  'fake',
  'inappropriate',
  'underage',
  'other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export type BlockStatusResponse = ApiEnvelope & {
  TargetUserId?: number;
  targetUserId?: number;
  BlockedByMe?: boolean;
  blockedByMe?: boolean;
  BlockedMe?: boolean;
  blockedMe?: boolean;
};

export type BlockedUserItem = {
  UserId: number;
  FirstName: string;
  LastName: string;
  Username: string;
  ProfileImage?: string | null;
  BlockedAt?: string;
  userId?: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  profileImage?: string | null;
  blockedAt?: string;
};

export type BlockedUsersResponse = ApiEnvelope & {
  Items?: BlockedUserItem[];
  items?: BlockedUserItem[];
};

export function normalizeBlockedUser(item: BlockedUserItem) {
  return {
    UserId: item.UserId ?? item.userId ?? 0,
    FirstName: item.FirstName ?? item.firstName ?? '',
    LastName: item.LastName ?? item.lastName ?? '',
    Username: item.Username ?? item.username ?? '',
    ProfileImage: item.ProfileImage ?? item.profileImage ?? null,
    BlockedAt: item.BlockedAt ?? item.blockedAt ?? '',
  };
}

export async function getBlockStatus(targetUserId: number) {
  return apiRequest<BlockStatusResponse>(API_PATHS.safetyStatus, {
    query: { targetUserId },
  });
}

export async function blockUser(targetUserId: number) {
  return apiRequest<ApiEnvelope>(API_PATHS.safetyBlock, {
    method: 'POST',
    body: { TargetUserId: targetUserId },
  });
}

export async function unblockUser(targetUserId: number) {
  return apiRequest<ApiEnvelope>(API_PATHS.safetyUnblock, {
    method: 'DELETE',
    query: { targetUserId },
  });
}

export async function reportUser(
  targetUserId: number,
  reason: ReportReason,
  details?: string,
) {
  return apiRequest<ApiEnvelope>(API_PATHS.safetyReport, {
    method: 'POST',
    body: {
      TargetUserId: targetUserId,
      Reason: reason,
      Details: details,
    },
  });
}

/** Reports with free-text details, blocks, and notifies the admin in one call. */
export async function reportAndBlockUser(targetUserId: number, details: string) {
  const trimmed = details.trim();
  try {
    return await apiRequest<ApiEnvelope>(API_PATHS.safetyReportAndBlock, {
      method: 'POST',
      body: { TargetUserId: targetUserId, Details: trimmed },
    });
  } catch (error) {
    // Prod IIS build may not include report-and-block yet (404).
    if (!(error instanceof ApiError) || (error.status !== 404 && error.status !== 405)) {
      throw error;
    }
    await reportUser(targetUserId, 'other', trimmed);
    return blockUser(targetUserId);
  }
}

export async function getBlockedUsers() {
  const res = await apiRequest<BlockedUsersResponse>(API_PATHS.safetyBlocks);
  const raw = res.Items ?? res.items ?? [];
  return Promise.all(
    raw.map(async item => {
      const user = normalizeBlockedUser(item);
      return {
        ...user,
        ProfileImage: (await resolveMediaUrl(user.ProfileImage)) ?? user.ProfileImage,
      };
    }),
  );
}

export function isBlockedByMe(status: BlockStatusResponse | null | undefined) {
  return Boolean(status?.BlockedByMe ?? status?.blockedByMe);
}
