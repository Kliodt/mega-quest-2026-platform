import { StepState, StepKind, type TeamStep } from '@quest/shared';

export interface StepStateInput {
  answeredAt: Date | null;
}

/** Вопрос пройден по ответу, переход — по положению относительно текущего шага. */
export function getStepState(
  step: TeamStep,
  index: number,
  currentStepIndex: number,
  state: StepStateInput | undefined,
): StepState {
  if (step.kind === StepKind.QUESTION) {
    if (state?.answeredAt) {
      return StepState.DONE;
    }
    if (index === currentStepIndex) {
      return StepState.ACTIVE;
    }
    if (index === currentStepIndex + 1) {
      return StepState.AWAITING_CODE;
    }
    return StepState.LOCKED;
  }
  if (index < currentStepIndex) {
    return StepState.DONE;
  }
  if (index === currentStepIndex) {
    return StepState.ACTIVE;
  }
  return StepState.LOCKED;
}
