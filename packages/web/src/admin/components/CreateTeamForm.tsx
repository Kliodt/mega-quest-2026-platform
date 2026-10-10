import { StepKind, type AdminTeamDetailDto, type TeamStepDto } from '@quest/shared';
import { useState, type ReactNode } from 'react';
import { ErrorBanner } from '../../components/ErrorBanner.js';
import { getErrorMessage } from '../../utils/errorMessage.js';
import { useCreateTeamMutation } from '../queries.js';
import { RouteEditor } from './RouteEditor.js';

interface CreateTeamFormProps {
  onCreated: (detail: AdminTeamDetailDto) => void;
}

const EMPTY_ROUTE: TeamStepDto[] = [{ kind: StepKind.LOCATION_TRANSITION }];

export function CreateTeamForm({ onCreated }: CreateTeamFormProps): ReactNode {
  const create = useCreateTeamMutation();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [sequence, setSequence] = useState<TeamStepDto[]>(EMPTY_ROUTE);

  const handleSubmit = (event: { preventDefault: () => void }): void => {
    event.preventDefault();
    create.mutate({ name: name.trim(), password, sequence }, { onSuccess: onCreated });
  };

  let errorMessage: string | null = null;
  if (create.isError) {
    errorMessage = getErrorMessage(create.error);
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <h2 className="sectionTitle">Новая команда</h2>
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
            disabled={create.isPending}
          />
        </label>
        <label className="field">
          <span>Пароль</span>
          <input
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={4}
            maxLength={200}
            autoComplete="off"
            disabled={create.isPending}
          />
        </label>
      </div>
      <RouteEditor value={sequence} onChange={setSequence} lockedThroughIndex={-1} />
      <div>
        <button
          className="btn"
          type="submit"
          disabled={create.isPending || name.trim() === '' || password.length < 4}
        >
          {create.isPending ? 'Создаём…' : 'Создать команду'}
        </button>
      </div>
    </form>
  );
}
