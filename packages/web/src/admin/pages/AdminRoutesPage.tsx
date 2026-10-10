import { LocationTitles, StepKind, type AdminTeamSummaryDto } from '@quest/shared';
import classNames from 'classnames';
import { type ReactNode } from 'react';
import { Link } from 'react-router';
import { ErrorBanner } from '../../components/ErrorBanner.js';
import { Spinner } from '../../components/Spinner.js';
import { getErrorMessage } from '../../utils/errorMessage.js';
import { formatDuration } from '../../utils/format.js';
import { RouteValidation } from '../components/RouteValidation.js';
import { TEAM_STATUS_LABEL } from '../labels.js';
import { useAdminTeamsQuery } from '../queries.js';
import { toRouteSegments, type RouteCell } from '../utils/toRouteSegments.js';
import styles from './AdminRoutesPage.module.scss';

function toCellClassName(cell: RouteCell, currentStepIndex: number): string {
  if (cell.stepIndex === currentStepIndex) {
    return styles.current ?? '';
  }
  if (cell.stepIndex < currentStepIndex) {
    return styles.passed ?? '';
  }
  return '';
}

function toCellTitle(cell: RouteCell): string {
  if (cell.kind === StepKind.LOCATION_TRANSITION) {
    return 'выход из корпуса';
  }
  return 'вопрос';
}

interface RouteRowProps {
  team: AdminTeamSummaryDto;
  columnsCount: number;
}

function RouteRow({ team, columnsCount }: RouteRowProps): ReactNode {
  const segments = toRouteSegments(team.sequence);
  const columns = Array.from({ length: columnsCount }, (_, index) => segments[index] ?? null);
  return (
    <tr>
      <td className={styles.team}>
        <Link to={`/admin/teams/${team.teamId}`}>{team.teamName}</Link>
      </td>
      <td className={styles.tight}>{TEAM_STATUS_LABEL[team.status]}</td>
      <td className={classNames('mono', styles.tight)}>
        {team.currentStepIndex} / {team.totalSteps}
      </td>
      <td className={classNames('mono', styles.tight)}>{formatDuration(team.totalSeconds)}</td>
      {columns.map((segment, index) => (
        <td key={index}>
          {segment && (
            <>
              <div className={styles.location}>{LocationTitles[segment.location]}</div>
              <div className={styles.rooms}>
                {segment.cells.map((cell) => (
                  <span
                    key={cell.stepIndex}
                    className={classNames('mono', toCellClassName(cell, team.currentStepIndex))}
                    title={toCellTitle(cell)}
                  >
                    {cell.roomNumbers.join(' / ')}
                  </span>
                ))}
              </div>
            </>
          )}
        </td>
      ))}
    </tr>
  );
}

/** Маршруты всех команд одной таблицей: корпуса по порядку и аудитории внутри каждого. */
export function AdminRoutesPage(): ReactNode {
  const teamsQuery = useAdminTeamsQuery();

  if (teamsQuery.isPending) {
    return <Spinner label="Загружаем маршруты…" />;
  }
  if (teamsQuery.isError) {
    return <ErrorBanner message={getErrorMessage(teamsQuery.error)} />;
  }

  const teams = [...teamsQuery.data.teams].sort((first, second) =>
    first.teamName.localeCompare(second.teamName, 'ru'),
  );
  const columnsCount = teams.reduce(
    (max, team) => Math.max(max, toRouteSegments(team.sequence).length),
    0,
  );

  return (
    <>
      <h1>Маршруты</h1>
      <RouteValidation />
      <p className="muted">
        Корпуса в порядке обхода, внутри — аудитории по шагам. Синим отмечен текущий шаг команды,
        серым — пройденные.
      </p>
      <div className={styles.scroll}>
        <table className="table">
          <thead>
            <tr>
              <th>Команда</th>
              <th>Статус</th>
              <th>Шаг</th>
              <th>Итог</th>
              {Array.from({ length: columnsCount }, (_, index) => (
                <th key={index}>Корпус {index + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <RouteRow key={team.teamId} team={team} columnsCount={columnsCount} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
