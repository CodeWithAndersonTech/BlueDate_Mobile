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
