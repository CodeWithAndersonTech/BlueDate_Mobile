import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfilePhoto } from '../../api/user';
import {
  deleteUserPhoto,
  getUserPhotos,
  resolveMediaUrl,
  uploadAvatarPhoto,
  uploadGalleryPhoto,
  UserPhotoItem,
  UserPhotoKind,
} from '../../api/photos';

/** Max gallery photos per profile (avatar is separate). */
export const MAX_GALLERY_PHOTOS = 5;

export type ProfilePhoto = {
  /** Stable UI key */
  id: string;
  remoteId?: number;
  uri: string;
  sortOrder: number;
  /** True when only stored on device (upload pending / offline). */
  localOnly?: boolean;
  kind?: number;
};

export class PhotoLimitError extends Error {
  constructor() {
    super('PHOTO_LIMIT');
    this.name = 'PhotoLimitError';
  }
}

type LocalBundle = {
  avatarUri?: string;
  gallery: ProfilePhoto[];
};

function storageKey(userId: number) {
  return `@bluedate/user_photos/${userId}`;
}

async function readLocal(userId: number): Promise<LocalBundle> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return { gallery: [] };
    const parsed = JSON.parse(raw) as LocalBundle;
    return {
      avatarUri: parsed.avatarUri,
      gallery: Array.isArray(parsed.gallery) ? parsed.gallery : [],
    };
  } catch {
    return { gallery: [] };
  }
}

async function writeLocal(userId: number, bundle: LocalBundle) {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(bundle));
}

export async function loadProfilePhotos(
  userId: number,
  token?: string | null,
): Promise<{ avatarUri?: string; avatar?: ProfilePhoto; gallery: ProfilePhoto[] }> {
  const local = await readLocal(userId);
  let remoteGallery: ProfilePhoto[] = [];
  let remoteAvatar: string | undefined;
  let avatarPhoto: ProfilePhoto | undefined;

  try {
    const allRes = await getUserPhotos(userId, undefined, token);
    const items = allRes.Items ?? [];
    const galleryItems = items.filter(item => item.Kind !== UserPhotoKind.Avatar);
    const avatarItem = items.find(item => item.Kind === UserPhotoKind.Avatar);

    remoteGallery = await Promise.all(
      galleryItems.map((item, index) => mapRemotePhoto(item, index)),
    );

    if (avatarItem) {
      avatarPhoto = await mapRemotePhoto(avatarItem, -1);
      avatarPhoto.kind = UserPhotoKind.Avatar;
      remoteAvatar = avatarPhoto.uri;
    }

    if (__DEV__) {
      console.log(
        `[photos] user=${userId} gallery=${remoteGallery.length} avatar=${remoteAvatar ? 'yes' : 'no'}`,
        remoteGallery.map(p => p.uri),
      );
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[photos] load failed, using local fallback', error);
    }
    /* offline / API down — use local only */
  }

  const pendingLocal = local.gallery.filter(p => p.localOnly);
  const gallery = [...remoteGallery, ...pendingLocal].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return {
    avatarUri: preferDisplayAvatar(remoteAvatar, local.avatarUri),
    avatar: avatarPhoto,
    gallery,
  };
}

const memoryAvatars = new Map<number, string>();

/** Prefer a reachable http(s) face over leftover file:// / empty values. */
export function preferDisplayAvatar(
  ...candidates: Array<string | null | undefined>
): string | undefined {
  const list = candidates
    .map(value => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);
  return (
    list.find(uri => /^https?:\/\//i.test(uri)) ??
    list.find(uri => !uri.startsWith('file://')) ??
    list[0]
  );
}

export function peekCachedAvatar(userId: number | null | undefined): string | undefined {
  if (!userId) return undefined;
  return memoryAvatars.get(userId);
}

export function rememberAvatar(userId: number, uri?: string | null) {
  const next = preferDisplayAvatar(uri);
  if (!userId || !next) return;
  memoryAvatars.set(userId, next);
}

/**
 * Photos shown on a profile: avatar (if any) + gallery, de-duplicated by URL.
 * Used for friend/other profile grids and the photo count stat.
 */
async function mapRemotePhoto(
  item: Pick<UserPhotoItem, 'Id' | 'Url' | 'SortOrder' | 'Kind'>,
  index = 0,
): Promise<ProfilePhoto> {
  return {
    id: `remote-${item.Id}`,
    remoteId: item.Id,
    uri: (await resolveMediaUrl(item.Url)) ?? item.Url,
    sortOrder: item.SortOrder ?? index,
    localOnly: false,
    kind: item.Kind,
  };
}

function samePhotoUri(a?: string | null, b?: string | null): boolean {
  const left = (a ?? '').replace(/\/+$/, '');
  const right = (b ?? '').replace(/\/+$/, '');
  if (!left || !right) {
    return false;
  }
  return left === right || left.endsWith(right) || right.endsWith(left);
}

export async function photosFromProfile(
  photos: UserProfilePhoto[] | null | undefined,
): Promise<ProfilePhoto[]> {
  const list = (photos ?? []).filter(item => Number(item.Id) > 0 && item.Url);
  return Promise.all(list.map((item, index) => mapRemotePhoto(item, index)));
}

export function mergePhotoLists(...lists: ProfilePhoto[][]): ProfilePhoto[] {
  const byKey = new Map<string, ProfilePhoto>();
  lists.flat().forEach(photo => {
    const key = photo.remoteId
      ? `id:${photo.remoteId}`
      : `uri:${(photo.uri ?? '').replace(/\/+$/, '')}`;
    if (!key.endsWith(':') && !byKey.has(key)) {
      byKey.set(key, photo);
    }
  });
  return [...byKey.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function mergeAvatarIntoDisplayPhotos(bundle: {
  avatarUri?: string;
  avatar?: ProfilePhoto;
  gallery: ProfilePhoto[];
}): ProfilePhoto[] {
  const gallery = bundle.gallery ?? [];
  const avatar = bundle.avatar;
  const avatarUri = (avatar?.uri ?? bundle.avatarUri ?? '').trim();
  if (!avatarUri) {
    return gallery;
  }

  const alreadyInGallery = gallery.some(p => samePhotoUri(p.uri, avatarUri));
  if (alreadyInGallery) {
    return gallery.map(photo =>
      samePhotoUri(photo.uri, avatarUri)
        ? { ...photo, kind: photo.kind ?? UserPhotoKind.Avatar }
        : photo,
    );
  }

  return [
    {
      id: avatar?.id ?? `remote-${avatar?.remoteId ?? 'avatar'}`,
      remoteId: avatar?.remoteId,
      uri: avatarUri,
      sortOrder: -1,
      localOnly: false,
      kind: UserPhotoKind.Avatar,
    },
    ...gallery,
  ];
}

export async function pickAndAddGalleryPhoto(
  userId: number,
  asset: { uri: string; fileName?: string; type?: string },
  token?: string | null,
): Promise<ProfilePhoto> {
  const current = await loadProfilePhotos(userId, token);
  if (current.gallery.length >= MAX_GALLERY_PHOTOS) {
    throw new PhotoLimitError();
  }

  try {
    const uploaded = await uploadGalleryPhoto(userId, asset, token);
    const uri = (await resolveMediaUrl(uploaded.Url)) ?? uploaded.Url;
    const photo: ProfilePhoto = {
      id: `remote-${uploaded.Id}`,
      remoteId: uploaded.Id,
      uri,
      sortOrder: uploaded.SortOrder ?? 0,
      localOnly: false,
    };
    // Drop matching local pending if any
    const local = await readLocal(userId);
    local.gallery = local.gallery.filter(p => p.uri !== asset.uri);
    await writeLocal(userId, local);
    return photo;
  } catch {
    const local = await readLocal(userId);
    const photo: ProfilePhoto = {
      id: `local-${Date.now()}`,
      uri: asset.uri,
      sortOrder: local.gallery.length,
      localOnly: true,
    };
    local.gallery = [...local.gallery, photo];
    await writeLocal(userId, local);
    return photo;
  }
}

export async function pickAndSetAvatar(
  userId: number,
  asset: { uri: string; fileName?: string; type?: string },
  token?: string | null,
): Promise<string> {
  try {
    const uploaded = await uploadAvatarPhoto(userId, asset, token);
    const uri = (await resolveMediaUrl(uploaded.Url)) ?? uploaded.Url;
    const local = await readLocal(userId);
    local.avatarUri = uri;
    await writeLocal(userId, local);
    return uri;
  } catch {
    const local = await readLocal(userId);
    local.avatarUri = asset.uri;
    await writeLocal(userId, local);
    return asset.uri;
  }
}

export async function removeGalleryPhoto(
  userId: number,
  photo: ProfilePhoto,
  token?: string | null,
): Promise<string | undefined> {
  let remoteId = photo.remoteId;
  if (!remoteId) {
    const bundle = await loadProfilePhotos(userId, token);
    remoteId =
      bundle.avatar && samePhotoUri(bundle.avatar.uri, photo.uri)
        ? bundle.avatar.remoteId
        : bundle.gallery.find(item => samePhotoUri(item.uri, photo.uri))
            ?.remoteId;
  }
  if (remoteId) {
    try {
      await deleteUserPhoto(userId, remoteId, token);
    } catch {
      /* still remove locally */
    }
  }
  const local = await readLocal(userId);
  local.gallery = local.gallery.filter(
    item => item.id !== photo.id && !samePhotoUri(item.uri, photo.uri),
  );
  if (samePhotoUri(local.avatarUri, photo.uri)) {
    local.avatarUri = undefined;
  }
  await writeLocal(userId, local);
  if (samePhotoUri(peekCachedAvatar(userId), photo.uri)) {
    memoryAvatars.delete(userId);
  }

  const remaining = await loadProfilePhotos(userId, token).catch(() => ({
    avatarUri: undefined as string | undefined,
    avatar: undefined as ProfilePhoto | undefined,
    gallery: [] as ProfilePhoto[],
  }));
  let nextUri = remaining.avatarUri ?? remaining.gallery[0]?.uri;
  if (!remaining.avatar && remaining.gallery[0]) {
    try {
      nextUri = await pickAndSetAvatar(
        userId,
        { uri: remaining.gallery[0].uri },
        token,
      );
    } catch {
      /* keep gallery face locally */
    }
  }
  if (nextUri) {
    rememberAvatar(userId, nextUri);
    const stored = await readLocal(userId);
    stored.avatarUri = nextUri;
    await writeLocal(userId, stored);
  }
  return nextUri;
}
