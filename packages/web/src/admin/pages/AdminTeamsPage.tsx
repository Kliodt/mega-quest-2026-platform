import { type AdminTeamSummaryDto } from '@quest/shared';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ErrorBanner } from '../../components/ErrorBanner.js';
import { Spinner } from '../../components/Spinner.js';
import { getErrorMessage } from '../../utils/errorMessage.js';
import { formatDuration, formatPenalty } from '../../utils/format.js';
import { CreateTeamForm } from '../components/CreateTeamForm.js';
import { TEAM_STATUS_LABEL } from '../labels.js';
import { useAdminTeamsQuery, useDeleteTeamMutation } from '../queries.js';
import styles from './AdminTeamsPage.module.scss';

export function AdminTeamsPage(): ReactNode {
  const teamsQuery = useAdminTeamsQuery();
  const deleteTeam = useDeleteTeamMutation();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const handleDelete = (team: AdminTeamSummaryDto): void => {
    const confirmed = window.confirm(
      `Удалить команду «${team.teamName}» вместе с её ответами и штрафами?`,
    );
    if (!confirmed) {
      return;
    }
    deleteTeam.mutate(team.teamId);
  };

  const teams = teamsQuery.data?.teams;

  let errorMessage: string | null = null;
  if (teamsQuery.isError) {
    errorMessage = getErrorMessage(teamsQuery.error);
  } else if (deleteTeam.isError) {
    errorMessage = getErrorMessage(deleteTeam.error);
  }

  return (
    <>
      <div className={styles.header}>
        <h1>Команды</h1>
        <button type="button" className="btn" onClick={() => setCreating((value) => !value)}>
          {creating ? 'Скрыть форму' : 'Добавить команду'}
        </button>
      </div>

      <ErrorBanner message={errorMessage} />

      {creating && (
        <CreateTeamForm
          onCreated={(detail) => {
            setCreating(false);
            void navigate(`/admin/teams/${detail.team.id}`);
          }}
        />
      )}

      {teamsQuery.isPending && <Spinner label="Загружаем команды…" />}

      {teams?.length === 0 && <p className="muted">Команд пока нет.</p>}

      {teams !== undefined && teams.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Команда</th>
              <th>Статус</th>
              <th>Шаг</th>
              <th>Решено</th>
              <th>Время</th>
              <th>Штрафы</th>
              <th>Итог</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr
                key={team.teamId}
                className="clickable"
                onClick={() => void navigate(`/admin/teams/${team.teamId}`)}
              >
                <td className="mono">{team.rank}</td>
                <td className={styles.name}>{team.teamName}</td>
                <td>{TEAM_STATUS_LABEL[team.status]}</td>
                <td className="mono">
                  {team.currentStepIndex} / {team.totalSteps}
                </td>
                <td className="mono">
                  {team.solvedCount} / {team.totalQuestions}
                </td>
                <td className="mono">{formatDuration(team.elapsedSeconds)}</td>
                <td className="mono">{formatPenalty(team.timeAdjustmentSeconds)}</td>
                <td className="mono">{formatDuration(team.totalSeconds)}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn--secondary btn--small"
                    disabled={deleteTeam.isPending}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(team);
                    }}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
