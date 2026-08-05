import { API_PATHS, getApiBaseUrl } from '../config/api';
import { getApiLanguageCode } from './languageHeader';
import {
  getAccessToken,
  refreshAccessToken,
} from './sessionStore';

export type ApiEnvelope = {
  IsSuccess: boolean;
  ErrorMessage?: string[] | null;
  SuccessMessage?: string | null;
};

export class ApiError extends Error {
  status: number;
  messages: string[];

  constructor(status: number, messages: string[], fallback = 'Request failed') {
    super(messages[0] ?? fallback);
    this.status = status;
    this.messages = messages;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  token?: string | null;
  /** Prevents recursive refresh when calling the refresh endpoint itself. */
  skipAuthRefresh?: boolean;
};

/** tr → Turkish; every other language → English. */
export function genericErrorMessage(languageCode = getApiLanguageCode()): string {
  const code = (languageCode || 'en').replace('_', '-').split('-')[0].toLowerCase();
  return code === 'tr' ? 'Bir hata oluştu.' : 'Something went wrong.';
}

function isTechnicalHttpMessage(message: string | undefined | null): boolean {
  if (!message || !message.trim()) {
    return true;
  }
  return /^HTTP\s*\d{3}\b/i.test(message.trim());
}

function extractErrorMessages(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const raw = payload as {
    ErrorMessage?: string[] | null;
    errorMessage?: string[] | null;
    message?: string | null;
    Message?: string | null;
  };

  const fromArray = [
    ...(raw.ErrorMessage ?? []),
    ...(raw.errorMessage ?? []),
  ].filter((m): m is string => typeof m === 'string' && m.trim().length > 0);

  if (fromArray.length) {
    return fromArray;
  }

  const single = raw.message ?? raw.Message;
  if (typeof single === 'string' && single.trim()) {
    return [single.trim()];
  }

  return [];
}

function buildUrl(path: string, query?: RequestOptions['query']): Promise<string> {
  return getApiBaseUrl().then(baseUrl => {
    const url = new URL(path.startsWith('http') ? path : `${baseUrl}${path}`);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      });
    }
    return url.toString();
  });
}

async function parsePayload<T>(response: Response): Promise<(T & ApiEnvelope) | null> {
  try {
    return (await response.json()) as T & ApiEnvelope;
  } catch {
    return null;
  }
}

function throwHttpError(status: number, payload: unknown): never {
  const extracted = extractErrorMessages(payload);
  const useGeneric =
    status >= 500 ||
    extracted.length === 0 ||
    isTechnicalHttpMessage(extracted[0]);

  throw new ApiError(status, useGeneric ? [genericErrorMessage()] : extracted);
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, query, token, skipAuthRefresh } = options;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Language-Code': getApiLanguageCode(),
    'Accept-Language': getApiLanguageCode(),
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const bearer = token ?? getAccessToken();
  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }

  let response: Response;
  try {
    const url = await buildUrl(path, query);
    if (__DEV__) {
      console.log(`[API] ${method} ${url}`);
    }
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, [genericErrorMessage()]);
  }

  let payload = await parsePayload<T>(response);

  if (response.status === 401 && !skipAuthRefresh && path !== API_PATHS.refresh) {
    const { refreshSession } = await import('./auth');
    const nextAccess = await refreshAccessToken(refreshToken =>
      refreshSession({ RefreshToken: refreshToken }),
    );

    if (nextAccess) {
      return apiRequest<T>(path, {
        ...options,
        token: nextAccess,
        skipAuthRefresh: true,
      });
    }
  }

  if (!response.ok) {
    throwHttpError(response.status, payload);
  }

  if (payload && typeof payload === 'object') {
    const envelope = payload as ApiEnvelope & {
      isSuccess?: boolean;
      errorMessage?: string[] | null;
      AccessToken?: string;
      accessToken?: string;
    };
    const isSuccess =
      typeof envelope.IsSuccess === 'boolean'
        ? envelope.IsSuccess
        : typeof envelope.isSuccess === 'boolean'
          ? envelope.isSuccess
          : undefined;
    const hasToken = Boolean(envelope.AccessToken || envelope.accessToken);

    if (isSuccess === false && !hasToken) {
      const extracted = extractErrorMessages(envelope);
      throw new ApiError(
        response.status,
        extracted.length && !isTechnicalHttpMessage(extracted[0])
          ? extracted
          : [genericErrorMessage()],
      );
    }
  }

  return payload as T;
}
