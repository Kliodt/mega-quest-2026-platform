import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

const ADMIN_TOKEN_STORAGE_KEY = 'quest.adminToken';

interface AdminAuthContextValue {
  adminToken: string | null;
  /** Токен был сброшен сервером как неверный: показать причину на странице входа */
  rejected: boolean;
  setAdminToken: (token: string) => void;
  clearAdminToken: (rejected?: boolean) => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null): void {
  try {
    if (token === null) {
      window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    } else {
      window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    }
  } catch {
    // без localStorage сессия организатора живёт до перезагрузки
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [adminToken, setTokenState] = useState<string | null>(readStoredToken);
  const [rejected, setRejected] = useState(false);

  const setAdminToken = useCallback((next: string) => {
    writeStoredToken(next);
    setRejected(false);
    setTokenState(next);
  }, []);

  const clearAdminToken = useCallback((wasRejected = false) => {
    writeStoredToken(null);
    setRejected(wasRejected);
    setTokenState(null);
  }, []);

  const value = useMemo(
    () => ({ adminToken, rejected, setAdminToken, clearAdminToken }),
    [adminToken, rejected, setAdminToken, clearAdminToken],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
