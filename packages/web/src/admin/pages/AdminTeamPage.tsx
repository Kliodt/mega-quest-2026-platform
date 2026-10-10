import classNames from 'classnames';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ErrorBanner } from '../../components/ErrorBanner.js';
import { Spinner } from '../../components/Spinner.js';
import { getErrorMessage } from '../../utils/errorMessage.js';
import { formatDuration, formatPenalty } from '../../utils/format.js';
import { RouteSection } from '../components/RouteSection.js';
import { TeamCredentialsForm } from '../components/TeamCredentialsForm.js';
import { TimeAdjustmentsPanel } from '../components/TimeAdjustmentsPanel.js';
import { TEAM_STATUS_LABEL } from '../labels.js';
import {
  useAdminTeamQuery,
  useAnswerForTeamMutation,
  useDeleteTeamMutation,
  useResetTeamMutation,
  useRewindTeamMutation,
  useScanForTeamMutation,
} from '../queries.js';
import styles from './AdminTeamPage.module.scss';

enum TeamTab {
  ROUTE = 'route',
  TIME_ADJUSTMENTS = 'timeAdjustments',
  CREDENTIALS = 'credentials',
}

const TAB_LABEL: Record<TeamTab, string> = {
  [TeamTab.ROUTE]: 'Маршрут',
  [TeamTab.TIME_ADJUSTMENTS]: 'Штрафы и бонусы',
  [TeamTab.CREDENTIALS]: 'Данные команды',
};

export function AdminTeamPage(): ReactNode {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(TeamTab.ROUTE);
  const teamQuery = useAdminTeamQuery(id);
  const reset = useResetTeamMutation(id);
  const rewind = useRewindTeamMutation(id);
  const answer = useAnswerForTeamMutation(id);
  const scan = useScanForTeamMutation(id);
  const remove = useDeleteTeamMutation();

  if (teamQuery.isPending) {
    return <Spinner label="Загружаем команду…" />;
  }
  if (teamQuery.isError) {
    return (
      <>
        <ErrorBanner message={getErrorMessage(teamQuery.error)} />
        <Link to="/admin/teams">← К списку команд</Link>
      </>
    );
  }
  const detail = teamQuery.data;

  const handleReset = (): void => {
    const confirmed = window.confirm(
      `Сбросить команду «${detail.team.name}»? Все ответы и поправки времени будут удалены, команда вернётся на старт.`,
    );
    if (confirmed) {
      reset.mutate();
    }
  };

  const handleRewind = (stepIndex: number): void => {
    const confirmed = window.confirm(
      `Вернуть команду к шагу ${stepIndex + 1}? Его прохождение и всё, что было после, будут стёрты; вопрос выдастся заново. Ручные штрафы и бонусы останутся.`,
    );
    if (confirmed) {
      rewind.mutate(stepIndex);
    }
  };

  const handleAnswer = (): void => {
    const confirmed = window.confirm(
      `Засчитать открытый вопрос команде «${detail.team.name}»? Ответ запишется как верный, команда пойдёт дальше.`,
    );
    if (confirmed) {
      answer.mutate();
    }
  };

  const handleScan = (): void => {
    const confirmed = window.confirm(
      `Засчитать скан кода команде «${detail.team.name}»? Откроется следующий шаг, как будто она отсканировала код на двери.`,
    );
    if (confirmed) {
      scan.mutate();
    }
  };

  const handleDelete = (): void => {
    const confirmed = window.confirm(`Удалить команду «${detail.team.name}» безвозвратно?`);
    if (confirmed) {
      remove.mutate(detail.team.id, { onSuccess: () => void navigate('/admin/teams') });
    }
  };

  let actionError: string | null = null;
  if (reset.isError) {
    actionError = getErrorMessage(reset.error);
  } else if (rewind.isError) {
    actionError = getErrorMessage(rewind.error);
  } else if (answer.isError) {
    actionError = getErrorMessage(answer.error);
  } else if (scan.isError) {
    actionError = getErrorMessage(scan.error);
  } else if (remove.isError) {
    actionError = getErrorMessage(remove.error);
  }

  return (
    <>
      <div className={styles.header}>
        <div>
          <Link to="/admin/teams" className={styles.back}>
            ← Команды
          </Link>
          <h1 className={styles.name}>{detail.team.name}</h1>
          <div className="muted">
            {TEAM_STATUS_LABEL[detail.team.status]}, шаг {detail.team.currentStepIndex} из{' '}
            {detail.team.sequence.length}
          </div>
        </div>
        <dl className={styles.totals}>
          <dt>Чистое время</dt>
          <dd className="mono">{formatDuration(detail.timer.elapsedSeconds)}</dd>
          <dt>Штрафы и бонусы</dt>
          <dd className="mono">{formatPenalty(detail.timer.timeAdjustmentSeconds)}</dd>
          <dt>Итог</dt>
          <dd className="mono">{formatDuration(detail.timer.totalSeconds)}</dd>
        </dl>
        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn--secondary btn--small"
            onClick={handleReset}
            disabled={reset.isPending}
          >
            {reset.isPending ? 'Сбрасываем…' : 'Сбросить прогресс'}
          </button>
          <button
            type="button"
            className="btn btn--danger btn--small"
            onClick={handleDelete}
            disabled={remove.isPending}
          >
            Удалить команду
          </button>
        </div>
      </div>

      <ErrorBanner message={actionError} />

      <nav className={styles.tabs} aria-label="Разделы команды">
        {Object.values(TeamTab).map((value) => (
          <button
            key={value}
            type="button"
            className={classNames(styles.tab, value === tab && styles.tabActive)}
            aria-current={value === tab}
            onClick={() => setTab(value)}
          >
            {TAB_LABEL[value]}
          </button>
        ))}
      </nav>

      {tab === TeamTab.ROUTE && (
        <RouteSection
          detail={detail}
          onRewind={handleRewind}
          rewinding={rewind.isPending}
          onAnswer={handleAnswer}
          answering={answer.isPending}
          onScan={handleScan}
          scanning={scan.isPending}
        />
      )}
      {tab === TeamTab.TIME_ADJUSTMENTS && <TimeAdjustmentsPanel detail={detail} />}
      {tab === TeamTab.CREDENTIALS && (
        <TeamCredentialsForm key={`${detail.team.id}-${detail.team.name}`} detail={detail} />
      )}
    </>
  );
}
