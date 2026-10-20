import {
  NativeModules,
  PermissionsAndroid,
  Platform,
  TurboModuleRegistry,
} from 'react-native';

export type Coordinates = { latitude: number; longitude: number };

type GeolocationModule = typeof import('@react-native-community/geolocation').default;

let geolocation: GeolocationModule | null | undefined;

/** New Arch `getEnforcing('RNCGeolocation')` is fatal — never require the JS package until native is present. */
function isGeolocationNativePresent(): boolean {
  try {
    if (NativeModules.RNCGeolocation) return true;
    return TurboModuleRegistry.get('RNCGeolocation') != null;
  } catch {
    return false;
  }
}

function loadGeolocation(): GeolocationModule | null {
  if (geolocation !== undefined) return geolocation;
  if (!isGeolocationNativePresent()) {
    geolocation = null;
    return null;
  }
  try {
    geolocation = require('@react-native-community/geolocation')
      .default as GeolocationModule;
    geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      enableBackgroundLocationUpdates: false,
      locationProvider: 'auto',
    });
  } catch {
    geolocation = null;
  }
  return geolocation;
}

async function ensureAndroidPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

let lastCoords: Coordinates | null = null;

/** Last successful GPS fix, if any — never waits. */
export function peekLastCoordinates(): Coordinates | null {
  return lastCoords;
}

/** Best-effort single fix; resolves null when denied, unavailable or slow. */
export async function getCurrentCoordinates(timeoutMs = 8000): Promise<Coordinates | null> {
  const geo = loadGeolocation();
  if (!geo) return lastCoords;
  if (!(await ensureAndroidPermission().catch(() => false))) return lastCoords;

  return new Promise(resolve => {
    let done = false;
    const finish = (value: Coordinates | null) => {
      if (done) return;
      done = true;
      if (value) lastCoords = value;
      resolve(value ?? lastCoords);
    };
    const timer = setTimeout(() => finish(null), timeoutMs + 1000);
    try {
      geo.getCurrentPosition(
        pos => {
          clearTimeout(timer);
          finish({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        () => {
          clearTimeout(timer);
          finish(null);
        },
        { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 120_000 },
      );
    } catch {
      clearTimeout(timer);
      finish(null);
    }
  });
}
