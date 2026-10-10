import { QuestPhase, TeamStatus, type ProgressDto } from '@quest/shared';
import { useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { useProgressQuery } from '../api/queries.js';
import { AchievementToast } from '../components/AchievementToast.js';
import { TimeAdjustments } from '../components/TimeAdjustments.js';
import { Timer } from '../components/Timer.js';
import { gameTypes } from '../games/registry.js';
import {
  Banner,
  BannerTone,
  Button,
  ButtonVariant,
  QuestShell,
  Spinner,
  TimeAdjustmentValue,
} from '../ui/index.js';
import { getErrorMessage } from '../utils/errorMessage.js';
import { formatAdjustment } from '../utils/format.js';
import styles from './QuestLayout.module.scss';
import { type QuestOutletContext } from './questOutletContext.js';

const MAP_PATH = '/map';
const QUESTION_PATH = '/question';

/** Игра во весь экран сама открывает доступ к платформе, поэтому шапку ей не рисуем. */
function isFullscreenGame(progress: ProgressDto): boolean {
  if (progress.question === null) {
    return false;
  }
  return gameTypes[progress.question.gameType].fullscreen === true;
}

/** Карта маршрута: точки, нанизанные на линию, — так она и выглядит на экране. */
function MapIcon(): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 20 3 17V4l6 3 6-3 6 3v13l-6-3-6 3z" />
      <path d="M9 7v13M15 4v13" />
    </svg>
  );
}

/** Стрелка вперёд: с карты команда возвращается к заданию, а не «назад» по истории. */
function TaskIcon(): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

/** Шапка квеста и загрузка прохождения: страницы получают его через контекст Outlet. */
export function QuestLayout(): ReactNode {
  const progressQuery = useProgressQuery();
  const location = useLocation();
  const [showAdjustments, setShowAdjustments] = useState(false);

  if (progressQuery.isPending) {
    return (
      <QuestShell>
        <Spinner label="Загружаем квест…" />
      </QuestShell>
    );
  }

  const progress = progressQuery.data;
  if (progress === undefined) {
    return (
      <QuestShell>
        <Banner message={getErrorMessage(progressQuery.error)} />
        <Button variant={ButtonVariant.SECONDARY} onClick={() => void progressQuery.refetch()}>
          Попробовать ещё раз
        </Button>
      </QuestShell>
    );
  }

  const showTimer = progress.team.status !== TeamStatus.NOT_STARTED;
  const timerPaused = progress.phase === QuestPhase.LOCATION_TRANSITION && showTimer;
  const onMap = location.pathname === MAP_PATH;

  const context: QuestOutletContext = {
    progress,
    receivedAt: progressQuery.dataUpdatedAt,
  };

  // Игра во весь экран притворяется чужим сайтом: платформы на экране быть не должно
  if (location.pathname === QUESTION_PATH && isFullscreenGame(progress)) {
    return <Outlet context={context} />;
  }

  let staleMessage: string | null = null;
  if (progressQuery.isError) {
    staleMessage = `Данные могли устареть: ${getErrorMessage(progressQuery.error)}`;
  }

  // Переход на карту и обратно — иконкой: подпись на бегу не читают
  let mapLink = { to: MAP_PATH, label: 'Карта маршрута', icon: <MapIcon /> };
  if (onMap) {
    mapLink = { to: '/', label: 'Вернуться к заданию', icon: <TaskIcon /> };
  }

  const header = (
    <header className={styles.header}>
      <div className={styles.row}>
        <div className={styles.team}>
          <Link
            className={styles.mapLink}
            to={mapLink.to}
            aria-label={mapLink.label}
            title={mapLink.label}
          >
            {mapLink.icon}
          </Link>
          <h1 className={styles.name}>{progress.team.name}</h1>
        </div>
        {showTimer && (
          // Время складывается из шагов и поправок, поэтому его разбор открывается нажатием
          <button
            type="button"
            className={styles.meters}
            onClick={() => setShowAdjustments(true)}
            aria-label="Из чего сложилось время"
          >
            <Timer
              timer={progress.timer}
              receivedAt={progressQuery.dataUpdatedAt}
              paused={timerPaused}
            />
            {progress.timer.timeAdjustmentSeconds !== 0 && (
              <TimeAdjustmentValue
                className={styles.adjustment}
                seconds={progress.timer.timeAdjustmentSeconds}
              >
                {formatAdjustment(progress.timer.timeAdjustmentSeconds)}
              </TimeAdjustmentValue>
            )}
          </button>
        )}
      </div>

      <AchievementToast achievements={progress.achievements} />
    </header>
  );

  return (
    <QuestShell header={header} quiet={location.pathname !== '/'}>
      <Banner tone={BannerTone.WARNING} message={staleMessage} />
      <Outlet context={context} />

      <TimeAdjustments
        open={showAdjustments}
        onClose={() => setShowAdjustments(false)}
        timeAdjustmentSeconds={progress.timer.timeAdjustmentSeconds}
        adjustments={progress.timeAdjustments}
        steps={progress.steps}
      />
    </QuestShell>
  );
}
