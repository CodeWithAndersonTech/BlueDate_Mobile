import {
  FriendshipRelation,
  getUserProfile,
  resolveMediaUrlWithBase,
  SocialUser,
  StoryUserGroup,
  UserProfileResponse,
} from '../../api';
import { getApiBaseUrl } from '../../config/api';
import { mergeAvatarIntoDisplayPhotos, ProfilePhoto } from '../photos/photoStore';

export const VISIT_STALE_MS = 20_000;

export type CachedVisit = {
  at: number;
  profile: UserProfileResponse;
  photos: ProfilePhoto[];
  avatarUri?: string;
  relation: number;
  friendshipId: number | null;
  displayAge: number | null;
  blockedByMe: boolean;
  stories: StoryUserGroup | null;
};

const cache = new Map<number, CachedVisit>();
const inflight = new Map<number, Promise<CachedVisit | null>>();

export function peekVisit(userId: number): CachedVisit | undefined {
  return cache.get(userId);
}

export function writeVisit(userId: number, next: CachedVisit) {
  cache.set(userId, next);
}

export function patchVisit(userId: number, patch: Partial<CachedVisit>) {
  const prev = cache.get(userId);
  if (!prev) return;
  cache.set(userId, { ...prev, ...patch });
}

export async function displayBundleFromProfile(profile: UserProfileResponse) {
  const base = await getApiBaseUrl();
  const avatarUri = resolveMediaUrlWithBase(base, profile.ProfileImage);
  const gallery = (profile.Photos ?? []).map((item, index) => ({
    id: `remote-${item.Id}`,
    remoteId: item.Id,
    uri: resolveMediaUrlWithBase(base, item.Url) ?? item.Url,
    sortOrder: item.SortOrder ?? index,
  }));
  return {
    avatarUri,
    photos: mergeAvatarIntoDisplayPhotos({ avatarUri, gallery }),
  };
}

export function seedVisitPreview(
  user: Pick<SocialUser, 'UserId' | 'FirstName' | 'LastName' | 'Username' | 'ProfileImage' | 'Bio' | 'IsVerified'>,
  relation = FriendshipRelation.None,
) {
  if (user.UserId <= 0) return;
  const prev = cache.get(user.UserId);
  if (prev && prev.at > 0) return;

  const avatarUri = user.ProfileImage ?? undefined;
  const photos: ProfilePhoto[] = avatarUri
    ? [{ id: `preview-${user.UserId}`, uri: avatarUri, sortOrder: 0 }]
    : [];

  cache.set(user.UserId, {
    at: 0,
    profile: {
      IsSuccess: true,
      Id: user.UserId,
      FirstName: user.FirstName ?? '',
      LastName: user.LastName ?? '',
      Username: user.Username ?? '',
      Email: '',
      Bio: user.Bio ?? null,
      ProfileImage: user.ProfileImage ?? null,
      IsEmailVerified: true,
      IsVerified: user.IsVerified ?? false,
      Interests: [],
    },
    photos,
    avatarUri,
    relation,
    friendshipId: null,
    displayAge: null,
    blockedByMe: false,
    stories: null,
  });
}

export function prefetchUserProfile(
  userId: number,
  token?: string | null,
  options?: { force?: boolean },
): Promise<CachedVisit | null> {
  if (!Number.isFinite(userId) || userId <= 0) {
    return Promise.resolve(null);
  }
  const running = inflight.get(userId);
  if (running) return running;
  const existing = cache.get(userId);
  if (
    !options?.force &&
    existing &&
    existing.at > 0 &&
    Date.now() - existing.at < VISIT_STALE_MS
  ) {
    return Promise.resolve(existing);
  }

  const task = (async () => {
    const profile = await getUserProfile(userId, token);
    if (!Number(profile?.Id)) return cache.get(userId) ?? null;
    const bundle = await displayBundleFromProfile(profile);
    const prev = cache.get(userId);
    const next: CachedVisit = {
      at: Date.now(),
      profile,
      photos: bundle.photos,
      avatarUri: bundle.avatarUri,
      relation: prev?.relation ?? FriendshipRelation.None,
      friendshipId: prev?.friendshipId ?? null,
      displayAge: typeof profile.Age === 'number' ? profile.Age : null,
      blockedByMe: prev?.blockedByMe ?? false,
      stories: prev?.stories ?? null,
    };
    cache.set(userId, next);
    return next;
  })()
    .catch(() => cache.get(userId) ?? null)
    .finally(() => {
      inflight.delete(userId);
    });

  inflight.set(userId, task);
  return task;
}

export function openFriendProfile(
  user: Pick<SocialUser, 'UserId' | 'FirstName' | 'LastName' | 'Username' | 'ProfileImage' | 'Bio' | 'IsVerified'>,
  token?: string | null,
  relation = FriendshipRelation.Friends,
) {
  seedVisitPreview(user, relation);
  void prefetchUserProfile(user.UserId, token);
}
