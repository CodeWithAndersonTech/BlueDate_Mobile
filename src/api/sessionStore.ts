import { appStorage } from '../utils/appStorage';

const ACCESS_TOKEN_KEY = '@bluedate/accessToken';
const REFRESH_TOKEN_KEY = '@bluedate/refreshToken';
const USER_ID_KEY = '@bluedate/userId';

type SessionListener = (session: {
  accessToken: string | null;
  refreshToken: string | null;
  userId: number | null;
}) => void;

let accessToken: string | null = null;
let refreshToken: string | null = null;
let userId: number | null = null;
let refreshInFlight: Promise<string | null> | null = null;
const listeners = new Set<SessionListener>();

function emit() {
  const snapshot = { accessToken, refreshToken, userId };
  listeners.forEach(listener => listener(snapshot));
}

export function subscribeSession(listener: SessionListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function getSessionUserId() {
  return userId;
}

export async function hydrateSessionFromStorage() {
  const [storedAccess, storedRefresh, storedUserId] = await Promise.all([
    appStorage.getItem(ACCESS_TOKEN_KEY),
    appStorage.getItem(REFRESH_TOKEN_KEY),
    appStorage.getItem(USER_ID_KEY),
  ]);

  accessToken = storedAccess;
  refreshToken = storedRefresh;
  userId = storedUserId ? Number(storedUserId) : null;
  emit();
  return { accessToken, refreshToken, userId };
}

export async function persistSessionTokens(next: {
  accessToken: string | null;
  refreshToken?: string | null;
  userId?: number | null;
}) {
  accessToken = next.accessToken;
  if (next.refreshToken !== undefined) {
    refreshToken = next.refreshToken;
  }
  if (next.userId !== undefined) {
    userId = next.userId;
  }

  if (accessToken) {
    await appStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    await appStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (refreshToken) {
    await appStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    await appStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  if (userId != null) {
    await appStorage.setItem(USER_ID_KEY, String(userId));
  } else {
    await appStorage.removeItem(USER_ID_KEY);
  }

  emit();
}

export async function clearSessionTokens() {
  await persistSessionTokens({
    accessToken: null,
    refreshToken: null,
    userId: null,
  });
}

/**
 * Single-flight refresh used by the API client on 401.
 * Returns the new access token, or null if refresh failed.
 */
export async function refreshAccessToken(
  refresher: (token: string) => Promise<{
    AccessToken?: string | null;
    RefreshToken?: string | null;
    UserId?: number | null;
  }>,
): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const currentRefresh = refreshToken;
    if (!currentRefresh) {
      return null;
    }

    try {
      const result = await refresher(currentRefresh);
      const nextAccess = result.AccessToken ?? null;
      if (!nextAccess) {
        await clearSessionTokens();
        return null;
      }

      await persistSessionTokens({
        accessToken: nextAccess,
        refreshToken: result.RefreshToken ?? currentRefresh,
        userId: result.UserId ?? userId,
      });
      return nextAccess;
    } catch {
      await clearSessionTokens();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}
