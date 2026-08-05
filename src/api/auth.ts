import { API_PATHS } from '../config/api';
import { apiRequest, ApiEnvelope } from './client';

export type RegisterRequest = {
  FirstName: string;
  LastName: string;
  Username: string;
  Email: string;
  Password: string;
  /** 1 = Men, 2 = Woman, 3 = Other */
  Gender: number;
  /** ISO date `YYYY-MM-DD` — required */
  BirthDate: string;
};

export type RegisterResponse = ApiEnvelope & {
  UserId: number;
};

export type LoginRequest = {
  Email: string;
  Password: string;
};

export type LoginResponse = ApiEnvelope & {
  AccessToken?: string;
  RefreshToken?: string;
  UserId?: number;
};

export type RefreshSessionRequest = {
  RefreshToken: string;
};

export type RefreshSessionResponse = ApiEnvelope & {
  AccessToken?: string;
  RefreshToken?: string;
  UserId?: number;
};

export function registerUser(payload: RegisterRequest) {
  return apiRequest<RegisterResponse>(API_PATHS.register, {
    method: 'POST',
    body: payload,
  });
}

export function loginUser(payload: LoginRequest) {
  return apiRequest<LoginResponse>(API_PATHS.login, {
    method: 'POST',
    body: payload,
  });
}

export function refreshSession(payload: RefreshSessionRequest) {
  return apiRequest<RefreshSessionResponse>(API_PATHS.refresh, {
    method: 'POST',
    body: payload,
    skipAuthRefresh: true,
  });
}

export type ChangePasswordRequest = {
  UserId: number;
  CurrentPassword: string;
  NewPassword: string;
};

export type ChangePasswordResponse = ApiEnvelope;

export function changePassword(
  payload: ChangePasswordRequest,
  token?: string | null,
) {
  return apiRequest<ChangePasswordResponse>(API_PATHS.changePassword, {
    method: 'POST',
    body: payload,
    token,
  });
}
