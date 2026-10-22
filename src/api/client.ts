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
  /** Keep a 200 body even when IsSuccess is false (usable Id still wins). */
  acceptFailedEnvelope?: boolean;
};

function isTr(languageCode = getApiLanguageCode()): boolean {
  return (languageCode || 'en').replace('_', '-').split('-')[0].toLowerCase() === 'tr';
}

/** tr → Turkish; every other language → English. */
export function genericErrorMessage(languageCode = getApiLanguageCode()): string {
  return isTr(languageCode) ? 'Bir hata oluştu.' : 'Something went wrong.';
}

export function networkErrorMessage(languageCode = getApiLanguageCode()): string {
  return isTr(languageCode)
    ? 'Sunucuya ulaşılamıyor. Biraz sonra tekrar dene.'
    : 'Could not reach the server. Try again in a moment.';
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

  // IIS rejects POST/PUT with no Content-Length (HTTP 411). Empty JSON
  // keeps body-less actions like Notification/clear and read-all alive.
  const serializedBody =
    body !== undefined
      ? JSON.stringify(body)
      : method === 'POST' || method === 'PUT'
        ? '{}'
        : undefined;
  if (serializedBody !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // Login/register/OTP/refresh must not send a stale JWT — IIS/JWT
  // middleware 401s before the handler reads the body.
  const bearer = skipAuthRefresh ? token ?? null : token ?? getAccessToken();
  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }

  const FETCH_TIMEOUT_MS = method === 'GET' ? 12000 : 20000;

  let response: Response;
  try {
    const url = await buildUrl(path, query);
    if (__DEV__) {
      console.log(`[API] ${method} ${url}`);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      response = await fetch(url, {
        method,
        headers,
        body: serializedBody,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    if (__DEV__) {
      console.warn(`[API] network ${method} ${path}`, err);
    }
    throw new ApiError(0, [networkErrorMessage()]);
  }

  let payload = await parsePayload<T>(response);

  // Login/register 401 is invalid credentials — never treat it as an expired JWT.
  if (
    response.status === 401 &&
    !skipAuthRefresh &&
    path !== API_PATHS.refresh &&
    bearer
  ) {
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

    const hasUsableId = Number(
      (envelope as { Id?: number; id?: number }).Id ??
        (envelope as { id?: number }).id ??
        0,
    ) > 0;
    if (
      isSuccess === false &&
      !hasToken &&
      !(options.acceptFailedEnvelope && hasUsableId)
    ) {
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
