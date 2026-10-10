import { StepKind, TimeAdjustmentType, type AdminTeamDetailDto } from '@quest/shared';
import classNames from 'classnames';
import { useState, type ReactNode } from 'react';
import { ErrorBanner } from '../../components/ErrorBanner.js';
import { TimeAdjustmentHistory } from '../../components/TimeAdjustmentHistory.js';
import { getErrorMessage } from '../../utils/errorMessage.js';
import { getRoomNumbersByStep } from '../../utils/getRoomNumbersByStep.js';
import { TIME_ADJUSTMENT_TYPE_LABEL } from '../../utils/labels.js';
import { useAddTimeAdjustmentMutation, useDeleteTimeAdjustmentMutation } from '../queries.js';
import styles from './TimeAdjustmentsPanel.module.scss';

interface TimeAdjustmentsPanelProps {
  detail: AdminTeamDetailDto;
}

const MANUAL_TYPES = [
  TimeAdjustmentType.PENALTY,
  TimeAdjustmentType.COMPENSATION,
  TimeAdjustmentType.OTHER,
];

const NO_STEP = '';

/** Знак секунд с типом сверяет форма, сервер этого не делает. */
function getSecondsError(type: TimeAdjustmentType, seconds: number): string | null {
  if (!Number.isInteger(seconds)) {
    return 'Введите целое число секунд';
  }
  if (seconds === 0) {
    return 'Ноль ничего не меняет';
  }
  if (type === TimeAdjustmentType.PENALTY && seconds < 0) {
    return 'Штраф — положительное число секунд';
  }
  if (type === TimeAdjustmentType.COMPENSATION && seconds > 0) {
    return 'Компенсация — отрицательное число секунд';
  }
  return null;
}

/** Все поправки времени команды, включая автоматические, и форма ручной поправки. */
export function TimeAdjustmentsPanel({ detail }: TimeAdjustmentsPanelProps): ReactNode {
  const add = useAddTimeAdjustmentMutation(detail.team.id);
  const remove = useDeleteTimeAdjustmentMutation(detail.team.id);
  const [type, setType] = useState<TimeAdjustmentType>(TimeAdjustmentType.PENALTY);
  const [seconds, setSeconds] = useState('');
  const [stepIndex, setStepIndex] = useState(NO_STEP);
  const [comment, setComment] = useState('');

  // Number, а не parseInt: `input[type=number]` отдаёт и «1.5», и «1e3», parseInt молча их обрежет
  const parsedSeconds = Number(seconds);
  let secondsError: string | null = null;
  if (seconds !== '') {
    secondsError = getSecondsError(type, parsedSeconds);
  }
  const canSubmit = seconds !== '' && secondsError === null && comment.trim() !== '';

  const questionSteps = detail.steps.filter((step) => step.kind === StepKind.QUESTION);
  const roomNumbers = getRoomNumbersByStep(detail.steps);

  const handleSubmit = (event: { preventDefault: () => void }): void => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    add.mutate(
      {
        timeAdjustmentSeconds: parsedSeconds,
        type,
        comment: comment.trim(),
        ...(stepIndex === NO_STEP ? {} : { stepIndex: Number(stepIndex) }),
      },
      {
        onSuccess: () => {
          setSeconds('');
          setComment('');
          setStepIndex(NO_STEP);
        },
      },
    );
  };

  const handleDelete = (id: string): void => {
    if (window.confirm('Отменить эту поправку времени?')) {
      remove.mutate(id);
    }
  };

  let errorMessage: string | null = null;
  if (add.isError) {
    errorMessage = getErrorMessage(add.error);
  } else if (remove.isError) {
    errorMessage = getErrorMessage(remove.error);
  }

  return (
    <section className="stack">
      <h2 className="sectionTitle">Штрафы и бонусы</h2>
      <ErrorBanner message={errorMessage} />

      <TimeAdjustmentHistory
        adjustments={detail.timeAdjustments}
        totalSeconds={detail.timer.timeAdjustmentSeconds}
        roomNumbers={roomNumbers}
        onDelete={handleDelete}
        deleting={remove.isPending}
      />

      <form className="row" onSubmit={handleSubmit}>
        <label className="field">
          <span>Причина</span>
          <select
            className="input"
            value={type}
            onChange={(event) => setType(event.target.value as TimeAdjustmentType)}
            disabled={add.isPending}
          >
            {MANUAL_TYPES.map((manualType) => (
              <option key={manualType} value={manualType}>
                {TIME_ADJUSTMENT_TYPE_LABEL[manualType]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Секунд (со знаком)</span>
          <input
            className="input mono"
            type="number"
            step={1}
            value={seconds}
            onChange={(event) => setSeconds(event.target.value)}
            disabled={add.isPending}
            aria-invalid={secondsError !== null}
          />
          {secondsError !== null && <span className={styles.fieldError}>{secondsError}</span>}
        </label>
        <label className="field">
          <span>Шаг</span>
          <select
            className="input"
            value={stepIndex}
            onChange={(event) => setStepIndex(event.target.value)}
            disabled={add.isPending}
          >
            <option value={NO_STEP}>вся команда</option>
            {questionSteps.map((step) => (
              <option key={step.stepIndex} value={step.stepIndex}>
                {step.stepIndex + 1}: ауд. {roomNumbers.get(step.stepIndex) ?? '?'}
              </option>
            ))}
          </select>
        </label>
        <label className={classNames('field', styles.commentField)}>
          <span>Комментарий</span>
          <input
            className="input"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={500}
            disabled={add.isPending}
          />
        </label>
        <button className="btn" type="submit" disabled={add.isPending || !canSubmit}>
          {add.isPending ? 'Сохраняем…' : 'Добавить'}
        </button>
      </form>
    </section>
  );
}
