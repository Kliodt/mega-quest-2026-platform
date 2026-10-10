import { AuthErrors } from '@quest/shared';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import httpStatus from 'http-status';
import { useState, type ReactNode } from 'react';
import { useAdminAuth } from '../admin/AdminAuthContext.js';
import { useAuth } from '../auth/AuthContext.js';
import { ApiError } from './errors.js';

/** Реакция на ошибку любого запроса: 401 сбрасывает админ-токен или сессию команды. */
export function QueryProvider({ children }: { children: ReactNode }): ReactNode {
  const { clearToken } = useAuth();
  const { clearAdminToken } = useAdminAuth();

  const [queryClient] = useState(() => {
    const onError = (error: unknown): void => {
      if (!(error instanceof ApiError) || error.status !== httpStatus.UNAUTHORIZED) {
        return;
      }
      if (error.code === AuthErrors.adminUnauthorized.code) {
        clearAdminToken(true);
        return;
      }
      clearToken(error.code);
    };

    return new QueryClient({
      queryCache: new QueryCache({ onError }),
      mutationCache: new MutationCache({ onError }),
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
