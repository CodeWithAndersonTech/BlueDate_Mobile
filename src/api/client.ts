import { getApiBaseUrl } from '../config/api';
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
  } catch (error) {
    const baseUrl = await getApiBaseUrl();
    const message =
      error instanceof Error ? error.message : 'Network request failed';
    throw new ApiError(0, [
      `Backend'e ulaşılamadı (${baseUrl}). API çalışıyor mu? Mac IP doğru mu? ${message}`,
    ]);
  }

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
      throw new ApiError(
        response.status,
        envelope.ErrorMessage?.filter(Boolean) ??
          envelope.errorMessage?.filter(Boolean) ??
          ['Request was not successful'],
      );
    }
  }

  return payload as T;
}
