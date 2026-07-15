import { API_PATHS } from '../config/api';
import { apiRequest, ApiEnvelope } from './client';

export type BootstrapDeviceRequest = {
  DeviceUniqueId: string;
  Platform: string;
  OsVersion?: string | null;
  LanguageCode: string;
  CultureCode?: string | null;
  Theme: string;
  PushToken?: string | null;
};

export type BootstrapDeviceResponse = ApiEnvelope & {
  Id: number;
  DeviceUniqueId: string;
  Platform: string;
  OsVersion?: string | null;
  LanguageCode: string;
  CultureCode?: string | null;
  Theme: string;
  UserId?: number | null;
  IsNew: boolean;
};

export type BindDeviceUserRequest = {
  DeviceUniqueId: string;
  UserId: number;
};

export type BindDeviceUserResponse = ApiEnvelope & {
  Id: number;
  UserId?: number | null;
};

export type UpdateDeviceLanguageRequest = {
  DeviceUniqueId: string;
  LanguageCode: string;
};

export type UpdateDeviceLanguageResponse = ApiEnvelope & {
  Id: number;
  LanguageCode: string;
  CultureCode?: string | null;
};

export function bootstrapDevice(payload: BootstrapDeviceRequest) {
  return apiRequest<BootstrapDeviceResponse>(API_PATHS.bootstrapDevice, {
    method: 'POST',
    body: payload,
  });
}

export function bindDeviceUser(payload: BindDeviceUserRequest) {
  return apiRequest<BindDeviceUserResponse>(API_PATHS.bindDeviceUser, {
    method: 'POST',
    body: payload,
  });
}

export function updateDeviceLanguage(payload: UpdateDeviceLanguageRequest) {
  return apiRequest<UpdateDeviceLanguageResponse>(API_PATHS.updateDeviceLanguage, {
    method: 'PUT',
    body: payload,
  });
}
