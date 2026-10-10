import { useMutation } from '@tanstack/react-query';
import classNames from 'classnames';
import { useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { ErrorBanner } from '../../components/ErrorBanner.js';
import { getErrorMessage } from '../../utils/errorMessage.js';
import { useAdminAuth } from '../AdminAuthContext.js';
import { checkAdminToken } from '../queries.js';
import styles from './AdminLoginPage.module.scss';

export function AdminLoginPage(): ReactNode {
  const { adminToken, rejected, setAdminToken } = useAdminAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const check = useMutation({ mutationFn: checkAdminToken });

  if (adminToken !== null) {
    return <Navigate to="/admin/teams" replace />;
  }

  const handleSubmit = (event: { preventDefault: () => void }): void => {
    event.preventDefault();
    const candidate = token.trim();
    check.mutate(candidate, {
      onSuccess: () => {
        setAdminToken(candidate);
        void navigate('/admin/teams', { replace: true });
      },
    });
  };

  let errorMessage: string | null = null;
  if (check.isError) {
    errorMessage = getErrorMessage(check.error);
  }

  return (
    <main className="container">
      <form className={classNames('card', styles.form)} onSubmit={handleSubmit}>
        <h1>Вход организатора</h1>
        {rejected && <p className={styles.notice}>Токен отклонён сервером, введите его снова.</p>}
        <ErrorBanner message={errorMessage} />
        <label className="field">
          <span>Токен администратора</span>
          <input
            className="input mono"
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            autoComplete="off"
            required
            disabled={check.isPending}
          />
        </label>
        <button className="btn" type="submit" disabled={check.isPending || token.trim() === ''}>
          {check.isPending ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </main>
  );
}
