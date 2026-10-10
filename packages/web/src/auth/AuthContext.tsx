import { type ApiErrorCode } from '@quest/shared';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

const TOKEN_STORAGE_KEY = 'quest.token';

interface AuthContextValue {
  token: string | null;
  authError: ApiErrorCode | null;
  setToken: (token: string) => void;
  clearToken: (reason?: ApiErrorCode) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null): void {
  try {
    if (token === null) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    } else {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  } catch {
    // localStorage может быть недоступен, тогда сессия живёт до перезагрузки
  }
}

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [token, setTokenState] = useState<string | null>(readStoredToken);
  const [authError, setAuthError] = useState<ApiErrorCode | null>(null);

  const setToken = useCallback((next: string) => {
    writeStoredToken(next);
    setAuthError(null);
    setTokenState(next);
  }, []);

  const clearToken = useCallback((reason?: ApiErrorCode) => {
    writeStoredToken(null);
    setAuthError(reason ?? null);
    setTokenState(null);
  }, []);

  const value = useMemo(
    () => ({ token, authError, setToken, clearToken }),
    [token, authError, setToken, clearToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
