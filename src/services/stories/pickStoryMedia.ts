import {
  launchCamera,
  type CameraOptions,
  type ImageLibraryOptions,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import {
  assetFromPickerResponse,
  isImagePickerAvailable,
  pickPhotoFromLibrary,
  type PickedPhotoAsset,
} from '../photos/pickImage';

export type PickedStoryAsset = PickedPhotoAsset & {
  mediaType: 'photo' | 'video';
};

export type StoryPickResult = {
  asset: PickedStoryAsset | null;
  didCancel: boolean;
  errorMessage?: string;
};

const STORY_VIDEO_MAX_SECONDS = 15;

function normalizePickResult(response: ImagePickerResponse): StoryPickResult {
  if (response.didCancel) {
    return { asset: null, didCancel: true };
  }
  if (response.errorCode) {
    return {
      asset: null,
      didCancel: false,
      errorMessage: response.errorMessage || response.errorCode,
    };
  }

  const base = assetFromPickerResponse(response);
  if (!base) {
    return { asset: null, didCancel: false, errorMessage: 'No media selected' };
  }

  const rawType = (response.assets?.[0]?.type || base.type || '').toLowerCase();
  const fileName = (base.fileName || '').toLowerCase();
  const isVideo =
    rawType.startsWith('video/') ||
    fileName.endsWith('.mp4') ||
    fileName.endsWith('.mov') ||
    fileName.endsWith('.m4v') ||
    fileName.endsWith('.webm');

  return {
    asset: {
      ...base,
      type: base.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
      mediaType: isVideo ? 'video' : 'photo',
    },
    didCancel: false,
  };
}

/** Opens the system camera for a photo or up to 15s video. */
export async function pickStoryMediaFromCamera(): Promise<StoryPickResult> {
  if (!isImagePickerAvailable()) {
    return {
      asset: null,
      didCancel: false,
      errorMessage: 'NATIVE_MODULE_MISSING',
    };
  }

  const options: CameraOptions = {
    mediaType: 'mixed',
    quality: 0.8,
    videoQuality: 'high',
    durationLimit: STORY_VIDEO_MAX_SECONDS,
    saveToPhotos: false,
    cameraType: 'back',
  };

  try {
    const response = await launchCamera(options);
    return normalizePickResult(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Camera picker failed';
    return { asset: null, didCancel: false, errorMessage: message };
  }
}

/** Picks a photo or video from the library. */
export async function pickStoryMediaFromLibrary(): Promise<StoryPickResult> {
  if (!isImagePickerAvailable()) {
    return {
      asset: null,
      didCancel: false,
      errorMessage: 'NATIVE_MODULE_MISSING',
    };
  }

  const options: ImageLibraryOptions = {
    mediaType: 'mixed',
    selectionLimit: 1,
    quality: 0.8,
    videoQuality: 'high',
  };

  const response = await pickPhotoFromLibrary(options);
  return normalizePickResult(response);
}
