import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type AuthStatus = 'bootstrapping' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  isSignedIn: boolean;
  /** Mock sign-in. Wire to a real API in a later phase. */
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('bootstrapping');

  // Simulate a splash / bootstrap delay before showing the auth flow.
  useEffect(() => {
    const t = setTimeout(() => setStatus('signedOut'), 1800);
    return () => clearTimeout(t);
  }, []);

  const signIn = useCallback(() => setStatus('signedIn'), []);
  const signOut = useCallback(() => setStatus('signedOut'), []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, isSignedIn: status === 'signedIn', signIn, signOut }),
    [status, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an <AuthProvider />');
  return ctx;
}
