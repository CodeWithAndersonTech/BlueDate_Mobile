import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { loginUser, refreshSession, registerUser } from '../api';
import {
  clearSessionTokens,
  hydrateSessionFromStorage,
  persistSessionTokens,
  refreshAccessToken,
  subscribeSession,
} from '../api/sessionStore';
import { useLocale } from '../i18n';
import { isJwtExpired } from '../utils/jwt';

type AuthStatus = 'bootstrapping' | 'signedOut' | 'signedIn';

type RegisterPayload = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  gender: number;
  /** ISO date `YYYY-MM-DD` */
  birthDate: string;
};

type RegisterResult = {
  userId: number;
  email: string;
  password: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type CompleteVerificationPayload = {
  email: string;
  password: string;
  userId: number;
};

interface AuthContextValue {
  status: AuthStatus;
  isSignedIn: boolean;
  userId: number | null;
  accessToken: string | null;
  signIn: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<RegisterResult>;
  completeEmailVerification: (
    payload: CompleteVerificationPayload,
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function hasActiveAccessToken(token: string | null | undefined): boolean {
  return Boolean(token) && !isJwtExpired(token);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { status: localeStatus, bindUser } = useLocale();
  const [status, setStatus] = useState<AuthStatus>('bootstrapping');
  const [userId, setUserId] = useState<number | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    return subscribeSession(session => {
      setAccessToken(session.accessToken);
      setUserId(session.userId);
      setStatus(prev => {
        // Hydrate owns the bootstrapping → signedIn/Out transition.
        if (prev === 'bootstrapping') {
          return prev;
        }
        // Cleared session (logout / failed refresh) → Login/Register.
        if (!session.accessToken) {
          return 'signedOut';
        }
        return 'signedIn';
      });
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (localeStatus === 'loading') {
        return;
      }

      try {
        const session = await hydrateSessionFromStorage();
        if (cancelled) {
          return;
        }

        // Fresh access token → enter the app.
        if (hasActiveAccessToken(session.accessToken)) {
          setAccessToken(session.accessToken);
          setUserId(session.userId);
          setStatus('signedIn');
          return;
        }

        // Expired/missing access token — try refresh before kicking to login.
        if (session.refreshToken) {
          const nextAccess = await refreshAccessToken(refreshToken =>
            refreshSession({ RefreshToken: refreshToken }),
          );
          if (cancelled) {
            return;
          }

          if (hasActiveAccessToken(nextAccess)) {
            setAccessToken(nextAccess);
            setUserId(session.userId);
            setStatus('signedIn');
            return;
          }
        }

        // No usable session — clear leftovers and show Login/Register.
        await clearSessionTokens();
        if (cancelled) {
          return;
        }
        setAccessToken(null);
        setUserId(null);
        setStatus('signedOut');
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setUserId(null);
          setStatus('signedOut');
        }
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [localeStatus]);

  const persistSession = useCallback(
    async (
      token: string | null,
      nextUserId: number | null,
      nextRefreshToken?: string | null,
    ) => {
      await persistSessionTokens({
        accessToken: token,
        refreshToken: nextRefreshToken,
        userId: nextUserId,
      });
      setAccessToken(token);
      setUserId(nextUserId);
    },
    [],
  );

  const signIn = useCallback(
    async (payload: LoginPayload) => {
      const response = await loginUser({
        Email: payload.email,
        Password: payload.password,
      });

      const nextUserId = response.UserId ?? null;
      const token =
        response.AccessToken ??
        (response as { accessToken?: string }).accessToken ??
        null;

      if (!token) {
        throw new Error(
          response.ErrorMessage?.[0] ?? 'Login failed — no access token',
        );
      }

      await persistSession(token, nextUserId, response.RefreshToken ?? null);

      if (nextUserId != null) {
        try {
          await bindUser(nextUserId);
        } catch {
          // Device binding is best-effort; session remains valid.
        }
      }

      setStatus('signedIn');
    },
    [persistSession, bindUser],
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<RegisterResult> => {
      const response = await registerUser({
        FirstName: payload.firstName,
        LastName: payload.lastName,
        Username: payload.username,
        Email: payload.email,
        Password: payload.password,
        Gender: payload.gender,
        BirthDate: payload.birthDate,
      });

      if (!response.IsSuccess || !response.UserId) {
        throw new Error(response.ErrorMessage?.[0] ?? 'Register failed');
      }

      // Bind requires JWT now — deferred until login/verification completes.
      return {
        userId: response.UserId,
        email: payload.email,
        password: payload.password,
      };
    },
    [],
  );

  const completeEmailVerification = useCallback(
    async (payload: CompleteVerificationPayload) => {
      const loginResponse = await loginUser({
        Email: payload.email,
        Password: payload.password,
      });

      if (!loginResponse.AccessToken) {
        throw new Error(
          loginResponse.ErrorMessage?.[0] ?? 'Login after verification failed',
        );
      }

      await persistSession(
        loginResponse.AccessToken,
        loginResponse.UserId ?? payload.userId,
        loginResponse.RefreshToken ?? null,
      );

      const nextUserId = loginResponse.UserId ?? payload.userId;
      try {
        await bindUser(nextUserId);
      } catch {
        // best-effort
      }

      setStatus('signedIn');
    },
    [persistSession, bindUser],
  );

  const signOut = useCallback(async () => {
    await clearSessionTokens();
    setAccessToken(null);
    setUserId(null);
    setStatus('signedOut');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      // App shell requires both signed-in status and a stored access token.
      // Expiry is enforced at hydrate + on 401 refresh failure (clears session).
      isSignedIn: status === 'signedIn' && Boolean(accessToken),
      userId,
      accessToken,
      signIn,
      register,
      completeEmailVerification,
      signOut,
    }),
    [
      status,
      userId,
      accessToken,
      signIn,
      register,
      completeEmailVerification,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an <AuthProvider />');
  }
  return ctx;
}
