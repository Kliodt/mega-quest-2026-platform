import { StepState, StepKind, TeamStatus } from '@quest/shared';

export const TEAM_STATUS_LABEL: Record<TeamStatus, string> = {
  [TeamStatus.NOT_STARTED]: 'не начали',
  [TeamStatus.IN_PROGRESS]: 'в пути',
  [TeamStatus.FINISHED]: 'финиш',
};

export const STEP_KIND_LABEL: Record<StepKind, string> = {
  [StepKind.LOCATION_TRANSITION]: 'переход между корпусами',
  [StepKind.ROOM_TRANSITION]: 'переход между аудиториями',
  [StepKind.QUESTION]: 'вопрос',
};

export const STEP_STATE_LABEL: Record<StepState, string> = {
  [StepState.LOCKED]: 'впереди',
  [StepState.AWAITING_CODE]: 'ждёт код',
  [StepState.ACTIVE]: 'сейчас',
  [StepState.DONE]: 'пройдено',
};
