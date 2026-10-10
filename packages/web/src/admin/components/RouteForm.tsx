import { TeamStatus, type AdminTeamDetailDto, type TeamStepDto } from '@quest/shared';
import { useState, type ReactNode } from 'react';
import { ErrorBanner } from '../../components/ErrorBanner.js';
import { getErrorMessage } from '../../utils/errorMessage.js';
import { useUpdateTeamMutation } from '../queries.js';
import { RouteEditor } from './RouteEditor.js';

interface RouteFormProps {
  detail: AdminTeamDetailDto;
  onSaved: () => void;
}

function getLockedThroughIndex(detail: AdminTeamDetailDto): number {
  if (detail.team.status === TeamStatus.NOT_STARTED) {
    return -1;
  }
  return Math.min(detail.team.currentStepIndex, detail.team.sequence.length - 1);
}

export function RouteForm({ detail, onSaved }: RouteFormProps): ReactNode {
  const update = useUpdateTeamMutation(detail.team.id);
  const [sequence, setSequence] = useState<TeamStepDto[]>(detail.team.sequence);

  const dirty = JSON.stringify(sequence) !== JSON.stringify(detail.team.sequence);

  let errorMessage: string | null = null;
  if (update.isError) {
    errorMessage = getErrorMessage(update.error);
  }

  return (
    <div className="stack">
      <ErrorBanner message={errorMessage} />
      <RouteEditor
        value={sequence}
        onChange={setSequence}
        lockedThroughIndex={getLockedThroughIndex(detail)}
      />
      <div className="row">
        <button
          type="button"
          className="btn"
          disabled={update.isPending || !dirty}
          onClick={() => update.mutate({ sequence }, { onSuccess: onSaved })}
        >
          {update.isPending ? 'Сохраняем…' : 'Сохранить маршрут'}
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          disabled={update.isPending || !dirty}
          onClick={() => setSequence(detail.team.sequence)}
        >
          Отменить изменения
        </button>
      </div>
    </div>
  );
}
