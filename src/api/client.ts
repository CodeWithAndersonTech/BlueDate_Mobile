import { API_BASE_URL } from '../config/api';
import { getApiLanguageCode } from './languageHeader';

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
};

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, query, token } = options;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Language-Code': getApiLanguageCode(),
    'Accept-Language': getApiLanguageCode(),
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload: (T & ApiEnvelope) | null = null;
  try {
    payload = (await response.json()) as T & ApiEnvelope;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.ErrorMessage?.filter(Boolean) ?? [`HTTP ${response.status}`],
    );
  }

  if (payload && typeof payload === 'object' && 'IsSuccess' in payload) {
    const hasToken =
      'AccessToken' in payload &&
      typeof (payload as { AccessToken?: string }).AccessToken === 'string' &&
      Boolean((payload as { AccessToken?: string }).AccessToken);

    if (!payload.IsSuccess && !hasToken) {
      throw new ApiError(
        response.status,
        payload.ErrorMessage?.filter(Boolean) ?? ['Request was not successful'],
      );
    }
  }

  return payload as T;
}
