import { useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useLogoutMutation } from '../api/queries.js';
import { useAuth } from '../auth/AuthContext.js';
import { QuestShell, Spinner } from '../ui/index.js';

/** Выход по адресу: кнопки в интерфейсе нет, чтобы не нажать её посреди квеста. */
export function LogoutPage(): ReactNode {
  const logout = useLogoutMutation();
  const { clearToken } = useAuth();
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    logout.mutate(undefined, {
      onSettled: () => {
        clearToken();
        void navigate('/login', { replace: true });
      },
    });
  }, [logout, clearToken, navigate]);

  return (
    <QuestShell>
      <Spinner label="Выходим…" />
    </QuestShell>
  );
}
