import { API_PATHS } from '../config/api';
import { apiRequest, ApiEnvelope } from './client';

export type RegisterBleDeviceResponse = ApiEnvelope & {
  DeviceId: number;
};

export type CreateBleTokenResponse = ApiEnvelope & {
  Token: string;
  TokenHash: string;
  ValidFrom: string;
  ValidTo: string;
};

export type SightingItemPayload = {
  SeenToken: string;
  Rssi: number;
  TxPower?: number | null;
  SeenAt: string;
};

export type SubmitSightingsResponse = ApiEnvelope & {
  Accepted: number;
  Resolved: number;
  Ignored: number;
  DirectEdges: number;
  BridgeEdges: number;
};

export type DirectNearbyItem = {
  UserId: number;
  FullName: string;
  ProfilePhotoUrl?: string | null;
  Age?: number | null;
  Rssi?: number | null;
  DistanceKm?: number | null;
  StrengthScore: number;
  LastSeenAt: string;
  HopCount: number;
};

export type BridgeNearbyItem = {
  UserId: number;
  FullName: string;
  ProfilePhotoUrl?: string | null;
  Age?: number | null;
  ViaUserId?: number | null;
  ViaFullName?: string | null;
  StrengthScore: number;
  LastSeenAt: string;
  HopCount: number;
};

export type NearbyProximityResponse = ApiEnvelope & {
  Direct: DirectNearbyItem[];
  Bridge: BridgeNearbyItem[];
};

type RawNearbyItem = {
  UserId?: number;
  userId?: number;
  FullName?: string;
  fullName?: string;
  ProfilePhotoUrl?: string | null;
  profilePhotoUrl?: string | null;
  Age?: number | null;
  age?: number | null;
  Rssi?: number | null;
  rssi?: number | null;
  DistanceKm?: number | null;
  distanceKm?: number | null;
  StrengthScore?: number;
  strengthScore?: number;
  LastSeenAt?: string;
  lastSeenAt?: string;
  HopCount?: number;
  hopCount?: number;
  ViaUserId?: number | null;
  viaUserId?: number | null;
  ViaFullName?: string | null;
  viaFullName?: string | null;
};

function pickNum(a?: number | null, b?: number | null): number | null {
  if (typeof a === 'number') return a;
  if (typeof b === 'number') return b;
  return null;
}

function normalizeDirect(item: RawNearbyItem): DirectNearbyItem {
  return {
    UserId: item.UserId ?? item.userId ?? 0,
    FullName: item.FullName ?? item.fullName ?? '',
    ProfilePhotoUrl: item.ProfilePhotoUrl ?? item.profilePhotoUrl ?? null,
    Age: pickNum(item.Age, item.age),
    Rssi: pickNum(item.Rssi, item.rssi),
    DistanceKm: pickNum(item.DistanceKm, item.distanceKm),
    StrengthScore: item.StrengthScore ?? item.strengthScore ?? 0,
    LastSeenAt: item.LastSeenAt ?? item.lastSeenAt ?? '',
    HopCount: item.HopCount ?? item.hopCount ?? 1,
  };
}

function normalizeBridge(item: RawNearbyItem): BridgeNearbyItem {
  return {
    UserId: item.UserId ?? item.userId ?? 0,
    FullName: item.FullName ?? item.fullName ?? '',
    ProfilePhotoUrl: item.ProfilePhotoUrl ?? item.profilePhotoUrl ?? null,
    Age: pickNum(item.Age, item.age),
    ViaUserId: pickNum(item.ViaUserId, item.viaUserId),
    ViaFullName: item.ViaFullName ?? item.viaFullName ?? null,
    StrengthScore: item.StrengthScore ?? item.strengthScore ?? 0,
    LastSeenAt: item.LastSeenAt ?? item.lastSeenAt ?? '',
    HopCount: item.HopCount ?? item.hopCount ?? 2,
  };
}

export function registerBleDevice(payload: {
  userId: number;
  deviceUniqueId: string;
  platform: string;
  deviceName?: string;
  pushToken?: string | null;
  osVersion?: string | null;
  token?: string | null;
}) {
  return apiRequest<RegisterBleDeviceResponse & { deviceId?: number }>(
    API_PATHS.bleDevice,
    {
      method: 'POST',
      token: payload.token,
      body: {
        UserId: payload.userId,
        DeviceUniqueId: payload.deviceUniqueId,
        Platform: payload.platform,
        DeviceName: payload.deviceName,
        PushToken: payload.pushToken ?? null,
        OsVersion: payload.osVersion ?? null,
      },
    },
  ).then(res => ({
    ...res,
    DeviceId: res.DeviceId ?? res.deviceId ?? 0,
  }));
}

export function createBleToken(payload: {
  userId: number;
  deviceId: number;
  token?: string | null;
}) {
  return apiRequest<CreateBleTokenResponse & { token?: string; tokenHash?: string }>(
    API_PATHS.bleToken,
    {
      method: 'POST',
      token: payload.token,
      body: {
        UserId: payload.userId,
        DeviceId: payload.deviceId,
      },
    },
  ).then(res => ({
    ...res,
    Token: res.Token ?? res.token ?? '',
    TokenHash: res.TokenHash ?? res.tokenHash ?? '',
    ValidFrom: res.ValidFrom ?? (res as { validFrom?: string }).validFrom ?? '',
    ValidTo: res.ValidTo ?? (res as { validTo?: string }).validTo ?? '',
  }));
}

export function submitBleSightings(payload: {
  userId: number;
  observerDeviceId: number;
  items: SightingItemPayload[];
  token?: string | null;
}) {
  return apiRequest<SubmitSightingsResponse>(API_PATHS.bleSightings, {
    method: 'POST',
    token: payload.token,
    body: {
      UserId: payload.userId,
      ObserverDeviceId: payload.observerDeviceId,
      Items: payload.items,
    },
  });
}

export async function fetchNearbyProximity(payload: {
  userId: number;
  token?: string | null;
}): Promise<NearbyProximityResponse> {
  const raw = await apiRequest<
    NearbyProximityResponse & {
      direct?: RawNearbyItem[];
      bridge?: RawNearbyItem[];
      isSuccess?: boolean;
    }
  >(API_PATHS.proximityNearby, {
    query: { userId: payload.userId },
    token: payload.token,
  });

  const direct = (raw.Direct ?? raw.direct ?? []).map(normalizeDirect);
  const bridge = (raw.Bridge ?? raw.bridge ?? []).map(normalizeBridge);

  return {
    IsSuccess: raw.IsSuccess ?? raw.isSuccess ?? true,
    ErrorMessage: raw.ErrorMessage,
    SuccessMessage: raw.SuccessMessage,
    Direct: direct,
    Bridge: bridge,
  };
}

export function resetProximity(payload: {
  userId: number;
  token?: string | null;
}) {
  return apiRequest<ApiEnvelope>(API_PATHS.proximityReset, {
    method: 'POST',
    token: payload.token,
    body: { UserId: payload.userId },
  });
}
