import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getStoredToken, setStoredToken, setUnauthorizedHandler } from '@/api/client';
import { getMe } from '@/api/admin';

export type Role = 'admin' | 'user';

interface AuthState {
  token: string | null;
  role: Role | null;
  userId: string | null;
  label: string | null;
  /** Auth status while verifying a token against the backend. */
  status: 'unauthenticated' | 'verifying' | 'authenticated';
}

interface AuthContextValue extends AuthState {
  /** Verify and store a token. Returns true on success. */
  login: (token: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    token: getStoredToken(),
    role: null,
    userId: null,
    label: null,
    status: getStoredToken() ? 'verifying' : 'unauthenticated',
  }));

  const logout = useCallback(() => {
    setStoredToken(null);
    setState({ token: null, role: null, userId: null, label: null, status: 'unauthenticated' });
  }, []);

  const verify = useCallback(async (token: string): Promise<boolean> => {
    setStoredToken(token);
    setState({ token, role: null, userId: null, label: null, status: 'verifying' });
    try {
      const me = await getMe();
      setState({
        token,
        role: me.role,
        userId: me.user_id,
        label: me.label ?? null,
        status: 'authenticated',
      });
      return true;
    } catch {
      // Invalid / expired token, or network failure: drop the session.
      setStoredToken(null);
      setState({ token: null, role: null, userId: null, label: null, status: 'unauthenticated' });
      return false;
    }
  }, []);

  const login = useCallback(
    async (token: string) => {
      const trimmed = token.trim();
      if (!trimmed) return false;
      return verify(trimmed);
    },
    [verify],
  );

  // Register global 401 handler.
  useEffect(() => {
    setUnauthorizedHandler(() => logout());
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Verify a previously-stored token on first load.
  useEffect(() => {
    const stored = getStoredToken();
    if (stored && state.status === 'verifying' && state.role === null) {
      void verify(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout, isAdmin: state.role === 'admin' }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
