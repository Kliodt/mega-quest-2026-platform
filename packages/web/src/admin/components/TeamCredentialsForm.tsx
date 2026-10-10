import { type AdminTeamDetailDto } from '@quest/shared';
import { useState, type ReactNode } from 'react';
import { ErrorBanner } from '../../components/ErrorBanner.js';
import { getErrorMessage } from '../../utils/errorMessage.js';
import { useUpdateTeamMutation } from '../queries.js';

interface TeamCredentialsFormProps {
  detail: AdminTeamDetailDto;
}

/** Имя и пароль команды. Пустой пароль означает «не менять». */
export function TeamCredentialsForm({ detail }: TeamCredentialsFormProps): ReactNode {
  const update = useUpdateTeamMutation(detail.team.id);
  const [name, setName] = useState(detail.team.name);
  const [password, setPassword] = useState('');

  const handleSubmit = (event: { preventDefault: () => void }): void => {
    event.preventDefault();
    const body: { name?: string; password?: string } = {};
    if (name.trim() !== detail.team.name) {
      body.name = name.trim();
    }
    if (password !== '') {
      body.password = password;
    }
    update.mutate(body, { onSuccess: () => setPassword('') });
  };

  let errorMessage: string | null = null;
  if (update.isError) {
    errorMessage = getErrorMessage(update.error);
  }

  const dirty = name.trim() !== detail.team.name || password !== '';

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <h2 className="sectionTitle">Данные команды</h2>
      <ErrorBanner message={errorMessage} />
      <div className="row">
        <label className="field">
          <span>Название</span>
          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={100}
            disabled={update.isPending}
          />
        </label>
        <label className="field">
          <span>Новый пароль</span>
          <input
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="оставьте пустым, чтобы не менять"
            minLength={4}
            maxLength={200}
            autoComplete="off"
            disabled={update.isPending}
          />
        </label>
        <button className="btn" type="submit" disabled={update.isPending || !dirty}>
          {update.isPending ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </div>
      {update.isSuccess && !dirty && <p className="muted">Сохранено.</p>}
    </form>
  );
}
