import { NativeModules, TurboModuleRegistry } from 'react-native';
import {
  launchImageLibrary,
  type ImageLibraryOptions,
  type ImagePickerResponse,
} from 'react-native-image-picker';

export type PickedPhotoAsset = {
  uri: string;
  fileName?: string;
  type?: string;
};

/**
 * True when the native ImagePicker module is linked in the running binary.
 * After adding react-native-image-picker you must rebuild the app (not just
 * Metro reload) or this stays false.
 */
export function isImagePickerAvailable(): boolean {
  try {
    const turbo = TurboModuleRegistry.get<{
      launchImageLibrary: unknown;
    }>('ImagePicker');
    if (turbo?.launchImageLibrary) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return NativeModules.ImagePicker != null;
}

/**
 * Opens the system photo library. Never throws for a missing native module —
 * returns an error response instead so UI can show a friendly alert.
 */
export async function pickPhotoFromLibrary(
  options: ImageLibraryOptions = {
    mediaType: 'photo',
    selectionLimit: 1,
    quality: 0.8,
  },
): Promise<ImagePickerResponse> {
  if (!isImagePickerAvailable()) {
    return {
      didCancel: false,
      errorCode: 'others',
      errorMessage: 'NATIVE_MODULE_MISSING',
    };
  }

  try {
    return await launchImageLibrary(options);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Image picker failed';
    return {
      didCancel: false,
      errorCode: 'others',
      errorMessage: message,
    };
  }
}

export function assetFromPickerResponse(
  response: ImagePickerResponse,
): PickedPhotoAsset | null {
  const asset = response.assets?.[0];
  if (!asset?.uri) {
    return null;
  }
  return {
    uri: asset.uri,
    fileName: asset.fileName ?? undefined,
    type: asset.type ?? undefined,
  };
}
