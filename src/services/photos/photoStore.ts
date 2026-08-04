import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  deleteUserPhoto,
  getUserPhotos,
  resolveMediaUrl,
  uploadAvatarPhoto,
  uploadGalleryPhoto,
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
): Promise<{ avatarUri?: string; gallery: ProfilePhoto[] }> {
  const local = await readLocal(userId);
  let remoteGallery: ProfilePhoto[] = [];
  let remoteAvatar: string | undefined;

  try {
    const [galleryRes, avatarRes] = await Promise.all([
      getUserPhotos(userId, UserPhotoKind.Gallery, token),
      getUserPhotos(userId, UserPhotoKind.Avatar, token),
    ]);

    remoteGallery = await Promise.all(
      (galleryRes.Items ?? []).map(async (item, index) => ({
        id: `remote-${item.Id}`,
        remoteId: item.Id,
        uri: (await resolveMediaUrl(item.Url)) ?? item.Url,
        sortOrder: item.SortOrder ?? index,
        localOnly: false,
      })),
    );

    const avatarItem = avatarRes.Items?.[0];
    if (avatarItem) {
      remoteAvatar = (await resolveMediaUrl(avatarItem.Url)) ?? avatarItem.Url;
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
    avatarUri: remoteAvatar ?? local.avatarUri,
    gallery,
  };
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
): Promise<void> {
  if (photo.remoteId) {
    try {
      await deleteUserPhoto(userId, photo.remoteId, token);
    } catch {
      /* still remove locally */
    }
  }
  const local = await readLocal(userId);
  local.gallery = local.gallery.filter(p => p.id !== photo.id);
  await writeLocal(userId, local);
}
