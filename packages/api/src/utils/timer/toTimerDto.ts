import { StepKind, type TimerDto } from '@quest/shared';
import { type TimerStep } from './types.js';

const RUNNING_KINDS = new Set<StepKind>([StepKind.QUESTION, StepKind.ROOM_TRANSITION]);

/**
 * @param timeAdjustmentSeconds сумма всех поправок времени команды (бонусы отрицательные)
 */
export function toTimerDto(
  steps: TimerStep[],
  currentStepIndex: number,
  now: Date,
  timeAdjustmentSeconds: number,
): TimerDto {
  let elapsedMs = 0;
  const lastIndex = Math.min(currentStepIndex, steps.length - 1);

  for (let i = 0; i <= lastIndex; i += 1) {
    const step = steps[i];
    if (!step) {
      continue;
    }
    if (step.kind === StepKind.QUESTION) {
      elapsedMs += getQuestionElapsedMs(step, now);
    } else if (step.kind === StepKind.ROOM_TRANSITION) {
      elapsedMs += getRoomTransitionElapsedMs(steps[i - 1], steps[i + 1], now);
    }
  }

  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const currentStep = steps[currentStepIndex];
  const running = currentStep !== undefined && RUNNING_KINDS.has(currentStep.kind);

  return {
    elapsedSeconds,
    timeAdjustmentSeconds,
    totalSeconds: Math.max(0, elapsedSeconds + timeAdjustmentSeconds),
    running,
  };
}

function getQuestionElapsedMs(step: TimerStep, now: Date): number {
  if (step.openedAt === null) {
    return 0;
  }
  const end = step.answeredAt ?? now;
  return Math.max(0, end.getTime() - step.openedAt.getTime());
}

/** Переход между аудиториями идёт от ответа на предыдущий вопрос до открытия следующего. */
function getRoomTransitionElapsedMs(
  previous: TimerStep | undefined,
  next: TimerStep | undefined,
  now: Date,
): number {
  const previousAnsweredAt = previous?.answeredAt ?? null;
  if (previousAnsweredAt === null) {
    return 0;
  }
  const end = next?.openedAt ?? now;
  return Math.max(0, end.getTime() - previousAnsweredAt.getTime());
}
