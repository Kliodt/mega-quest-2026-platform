import { AuthErrors, type ApiErrorCode } from '@quest/shared';
import { useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useLoginMutation, useTeamNamesQuery } from '../api/queries.js';
import { useAuth } from '../auth/AuthContext.js';
import {
  Banner,
  BannerTone,
  Button,
  PageTitle,
  PasswordField,
  QuestShell,
  SelectField,
} from '../ui/index.js';
import { getErrorMessage } from '../utils/errorMessage.js';
import styles from './LoginPage.module.scss';

// Сообщения на экране логина подробнее серверных: тут есть место объяснить, что делать
const AUTH_ERROR_MESSAGES: Partial<Record<ApiErrorCode, string>> = {
  [AuthErrors.sessionReplaced.code]:
    'Вход выполнен на другом устройстве. Войдите снова, чтобы продолжить здесь.',
  [AuthErrors.unauthorized.code]: 'Сессия истекла, войдите снова.',
};

export function LoginPage(): ReactNode {
  const { token, authError, setToken } = useAuth();
  const navigate = useNavigate();
  const login = useLoginMutation();
  const teamNames = useTeamNamesQuery();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  if (token !== null) {
    return <Navigate to="/" replace />;
  }

  let noticeMessage: string | null = null;
  if (authError !== null) {
    noticeMessage = AUTH_ERROR_MESSAGES[authError] ?? null;
  }

  const handleSubmit = (event: { preventDefault: () => void }): void => {
    event.preventDefault();
    login.mutate(
      { name, password },
      {
        onSuccess: (response) => {
          setToken(response.token);
          void navigate('/', { replace: true });
        },
      },
    );
  };

  let errorMessage: string | null = null;
  if (login.isError) {
    errorMessage = getErrorMessage(login.error);
  }

  let placeholder = 'Выберите команду';
  if (teamNames.isPending) {
    placeholder = 'Загружаем команды…';
  }

  return (
    <QuestShell>
      <form className={styles.form} onSubmit={handleSubmit}>
        <PageTitle>Квест</PageTitle>

        <Banner tone={BannerTone.INFO} message={noticeMessage} />
        <Banner message={errorMessage} />

        <SelectField
          label="Команда"
          placeholder={placeholder}
          value={name}
          options={(teamNames.data?.names ?? []).map((teamName) => ({
            value: teamName,
            label: teamName,
          }))}
          onChange={(event) => setName(event.target.value)}
          required
          disabled={login.isPending || teamNames.isPending}
        />

        <PasswordField
          label="Пароль"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={login.isPending}
        />

        <Button type="submit" fullWidth loading={login.isPending} loadingLabel="Входим…">
          Войти
        </Button>
      </form>
    </QuestShell>
  );
}
