import {
  StepKind,
  StepState,
  type AchievementDto,
  type QuestionCardDto,
  type StepCardDto,
} from '@quest/shared';
import classNames from 'classnames';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import {
  Button,
  ButtonSize,
  RoomPlate,
  RoomPlateSize,
  TimeAdjustmentValue,
  TimeValue,
} from '../ui/index.js';
import { formatAdjustment, formatDuration } from '../utils/format.js';
import { formatRoomNumbers } from '../utils/formatRoomNumber.js';
import { toRouteChapters } from '../utils/toRouteChapters.js';
import { AchievementModal } from './AchievementModal.js';
import styles from './RouteMap.module.scss';

interface RouteMapProps {
  cards: StepCardDto[];
  /** Достижение за вход на платформу: заданию оно не принадлежит, но на карте ему место */
  entryAchievement: AchievementDto | null;
}

const STATE_CLASS: Record<StepState, string | undefined> = {
  [StepState.LOCKED]: styles.locked,
  [StepState.AWAITING_CODE]: styles.current,
  [StepState.ACTIVE]: styles.current,
  [StepState.DONE]: styles.done,
};

interface QuestionRowProps {
  card: QuestionCardDto;
  number: number;
  onShowAchievement: (achievement: AchievementDto) => void;
}

/** Решённое задание показывает аудиторию, нерешённое — нет: номер бывает ответом. */
function QuestionRow({ card, number, onShowAchievement }: QuestionRowProps): ReactNode {
  const navigate = useNavigate();
  const achievement = card.achievement;

  if (card.state === StepState.DONE && card.roomNumbers !== null) {
    const penalty = card.timeAdjustmentSeconds ?? 0;
    return (
      <>
        <div className={styles.solved}>
          <span className={styles.head}>
            <RoomPlate
              size={RoomPlateSize.COMPACT}
              roomNumber={formatRoomNumbers(card.roomNumbers)}
            />
            {card.solvedSeconds !== null && (
              <TimeValue>{formatDuration(card.solvedSeconds)}</TimeValue>
            )}
          </span>
          {(penalty !== 0 || card.hintsCount > 0) && (
            <span className={styles.result}>
              {penalty !== 0 && (
                <TimeAdjustmentValue seconds={penalty}>
                  {formatAdjustment(penalty)}
                </TimeAdjustmentValue>
              )}
              {card.hintsCount > 0 && (
                <span className={styles.hints}>подсказок: {card.hintsCount}</span>
              )}
            </span>
          )}
        </div>
        {achievement !== null && (
          <button
            type="button"
            className={styles.achievement}
            onClick={() => onShowAchievement(achievement)}
            aria-label={`Достижение за задание ${number}`}
          >
            <img className={styles.achievementImage} src={achievement.image} alt="" />
          </button>
        )}
      </>
    );
  }
  if (card.state === StepState.LOCKED) {
    return <span className={styles.pending}>задание {number}</span>;
  }
  // Открытое задание ждёт на своём экране, нераскрытое — на экране кода
  let target = '/';
  if (card.state === StepState.ACTIVE) {
    target = '/question';
  }
  return (
    <>
      <span className={styles.pending}>задание {number}</span>
      <span className={styles.result}>
        {card.hintsCount > 0 && <span className={styles.hints}>подсказок: {card.hintsCount}</span>}
        <Button size={ButtonSize.SMALL} onClick={() => void navigate(target)}>
          Перейти
        </Button>
      </span>
    </>
  );
}

/** Номер задания сквозной по всему маршруту: по нему команда понимает, сколько пройдено. */
function toQuestionNumbers(cards: StepCardDto[]): ReadonlyMap<number, number> {
  const numbers = new Map<number, number>();
  cards
    .filter((card) => card.kind === StepKind.QUESTION)
    .forEach((card, index) => numbers.set(card.stepIndex, index + 1));
  return numbers;
}

/** Карта маршрута: главы по корпусам, внутри — задания по порядку. */
export function RouteMap({ cards, entryAchievement }: RouteMapProps): ReactNode {
  const chapters = toRouteChapters(cards);
  const numbers = toQuestionNumbers(cards);
  const [shown, setShown] = useState<AchievementDto | null>(null);

  return (
    <div className={styles.map}>
      {entryAchievement !== null && (
        <ol className={styles.steps}>
          <li className={classNames(styles.step, styles.done)}>
            <span className={styles.pending}>вход на платформу</span>
            <button
              type="button"
              className={styles.achievement}
              onClick={() => setShown(entryAchievement)}
              aria-label="Достижение вход на платформу"
            >
              <img className={styles.achievementImage} src={entryAchievement.image} alt="" />
            </button>
          </li>
        </ol>
      )}

      {chapters.map((chapter) => (
        <section key={chapter.transition.stepIndex} className={styles.chapter}>
          <h2 className={classNames(styles.place, STATE_CLASS[chapter.transition.state])}>
            {chapter.transition.locationTitle}
          </h2>
          {chapter.questions.length === 0 && (
            <p className={styles.finish}>Финиш: код на двери закрывает квест</p>
          )}
          <ol className={styles.steps}>
            {chapter.questions.map((card) => (
              <li key={card.stepIndex} className={classNames(styles.step, STATE_CLASS[card.state])}>
                <QuestionRow
                  card={card}
                  number={numbers.get(card.stepIndex) ?? 0}
                  onShowAchievement={setShown}
                />
              </li>
            ))}
          </ol>
        </section>
      ))}

      <AchievementModal achievement={shown} onClose={() => setShown(null)} />
    </div>
  );
}
