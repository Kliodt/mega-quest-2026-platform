import {
  LocationTitles,
  StepState,
  StepKind,
  type AdminQuestionStepDto,
  type AdminStepDto,
  type AdminTransitionStepDto,
} from '@quest/shared';
import classNames from 'classnames';
import { useState, type ReactNode } from 'react';
import { gameTypes } from '../../games/registry.js';
import { formatDuration, formatPenalty, formatTimeOfDay } from '../../utils/format.js';
import { STEP_KIND_LABEL, STEP_STATE_LABEL } from '../labels.js';
import styles from './StepsMap.module.scss';

interface StepsMapProps {
  steps: AdminStepDto[];
  /** Вернуть команду к началу шага-вопроса; кнопка есть только у уже открытых вопросов */
  onRewind: (stepIndex: number) => void;
  rewinding: boolean;
  /** Засчитать открытый вопрос за команду; кнопка есть только у него */
  onAnswer: () => void;
  answering: boolean;
  /** Засчитать скан кода за команду: шаг ждёт код или команда стоит на финише */
  onScan: () => void;
  scanning: boolean;
}

const STATE_CLASS: Record<StepState, string | undefined> = {
  [StepState.LOCKED]: styles.locked,
  [StepState.AWAITING_CODE]: styles.awaiting,
  [StepState.ACTIVE]: styles.active,
  [StepState.DONE]: styles.done,
};

/** Тип игры шага: у открытого вопроса свой, у неоткрытого — все, какие в его аудиториях. */
function describeGames(step: AdminQuestionStepDto): string {
  const opened = step.question;
  const refs = opened ? [opened] : step.options;
  return [...new Set(refs.map((ref) => gameTypes[ref.gameType].label))].join(' / ');
}

function describeQuestions(step: AdminQuestionStepDto): string {
  const opened = step.question;
  if (opened) {
    return `ауд. ${opened.roomNumber}, ${LocationTitles[opened.location]}`;
  }
  return step.options
    .map((option) => `ауд. ${option.roomNumber} (${LocationTitles[option.location]})`)
    .join(' / ');
}

function QuestionDetails({ step }: { step: AdminQuestionStepDto }): ReactNode {
  const opened = step.question;
  if (!opened) {
    return <p className="muted">Вопрос ещё не открывался.</p>;
  }
  const AttemptView = gameTypes[opened.gameType].AttemptView;
  return (
    <div className={styles.details}>
      <div>
        <div className={styles.detailsTitle}>Попытки</div>
        {step.attempts.length === 0 && <p className="muted">Ответов не было.</p>}
        {step.attempts.length > 0 && (
          <ol className={styles.attempts}>
            {step.attempts.map((attempt, index) => (
              <li
                key={index}
                className={classNames(
                  attempt.correct && styles.attemptCorrect,
                  !attempt.correct && styles.attemptWrong,
                )}
              >
                <span className={classNames('mono', styles.time)}>
                  {formatTimeOfDay(attempt.submittedAt)}
                </span>
                <AttemptView payload={attempt.payload} />
                <span className="mono muted">{attempt.correct ? 'верно' : 'неверно'}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div>
        <div className={styles.detailsTitle}>Подсказки</div>
        {step.hints.length === 0 && <p className="muted">Не брали.</p>}
        {step.hints.length > 0 && (
          <ul className={styles.hints}>
            {step.hints.map((hint) => (
              <li key={hint.index}>
                <span className={classNames('mono', styles.time)}>
                  {formatTimeOfDay(hint.takenAt)}
                </span>
                подсказка {hint.index + 1}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** У перехода между корпусами бывает своя аудитория: её скан закрывает предыдущий вопрос. */
function describeTransition(step: AdminTransitionStepDto): string {
  const exit = step.options[0];
  if (!exit) {
    return STEP_KIND_LABEL[step.kind];
  }
  return `${STEP_KIND_LABEL[step.kind]} через ауд. ${exit.roomNumber} (${LocationTitles[exit.location]})`;
}

function QuestionSummary({ step }: { step: AdminQuestionStepDto }): ReactNode {
  return (
    <dl className={styles.summary}>
      <dt>Время</dt>
      <dd className="mono">
        {step.solvedSeconds === null ? '—' : formatDuration(step.solvedSeconds)}
      </dd>
      <dt>Поправки</dt>
      <dd className="mono">{formatPenalty(step.timeAdjustmentSeconds)}</dd>
      <dt>Подсказки</dt>
      <dd className="mono">{step.hintsCount}</dd>
      <dt>Попытки</dt>
      <dd className="mono">
        {step.attemptsCount} <span className="muted">(неверных {step.wrongAttemptsCount})</span>
      </dd>
    </dl>
  );
}

/** Карта маршрута команды: по клику на вопрос раскрываются попытки и подсказки. */
export function StepsMap({
  steps,
  onRewind,
  rewinding,
  onAnswer,
  answering,
  onScan,
  scanning,
}: StepsMapProps): ReactNode {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <ol className={styles.list}>
      {steps.map((step, index) => {
        const isQuestion = step.kind === StepKind.QUESTION;
        const isOpen = openIndex === step.stepIndex;
        // Код команда сканирует дважды: чтобы открыть вопрос и чтобы закрыть квест на финише
        const awaitsCode =
          step.state === StepState.AWAITING_CODE ||
          (!isQuestion && step.state === StepState.ACTIVE && index === steps.length - 1);
        return (
          <li key={step.stepIndex} className={classNames(styles.card, STATE_CLASS[step.state])}>
            <div className={styles.head}>
              <span className={classNames('mono', styles.index)}>{step.stepIndex + 1}</span>
              <div className={styles.headText}>
                <span className={styles.badge}>{STEP_STATE_LABEL[step.state]}</span>
                <div className={styles.title}>
                  {isQuestion ? describeQuestions(step) : describeTransition(step)}
                </div>
                {isQuestion && <div className={styles.game}>{describeGames(step)}</div>}
              </div>
              {awaitsCode && (
                <div className={styles.headActions}>
                  <button
                    type="button"
                    className="btn btn--small"
                    disabled={scanning}
                    onClick={onScan}
                  >
                    {scanning ? 'Засчитываем…' : 'Засчитать скан'}
                  </button>
                </div>
              )}
              {isQuestion && (
                <div className={styles.headActions}>
                  {step.state === StepState.ACTIVE && (
                    <button
                      type="button"
                      className="btn btn--small"
                      disabled={answering}
                      onClick={onAnswer}
                    >
                      {answering ? 'Засчитываем…' : 'Засчитать ответ'}
                    </button>
                  )}
                  {step.openedAt !== null && (
                    <button
                      type="button"
                      className="btn btn--secondary btn--small"
                      disabled={rewinding}
                      onClick={() => onRewind(step.stepIndex)}
                    >
                      Вернуть сюда
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn--secondary btn--small"
                    onClick={() => setOpenIndex(isOpen ? null : step.stepIndex)}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? 'Скрыть ответы' : 'Ответы'}
                  </button>
                </div>
              )}
            </div>
            {isQuestion && <QuestionSummary step={step} />}
            {isQuestion && isOpen && <QuestionDetails step={step} />}
          </li>
        );
      })}
    </ol>
  );
}
