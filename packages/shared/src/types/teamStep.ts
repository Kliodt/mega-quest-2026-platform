import { StepKind } from '../enums.js';
import { type RoomRef } from './roomRef.js';

/** Переход между аудиториями внутри корпуса: сканируется дверь следующего вопроса. */
export interface RoomTransitionStep {
  kind: StepKind.ROOM_TRANSITION;
}

/**
 * Переход между корпусами: время стоит. `options` — аудитория, скан которой закрывает
 * предыдущий вопрос и запускает паузу; у первого шага маршрута её нет.
 */
export interface LocationTransitionStep {
  kind: StepKind.LOCATION_TRANSITION;
  options?: RoomRef[];
}

export interface QuestionStep {
  kind: StepKind.QUESTION;
  /** Аудитории, любая из которых открывает этот шаг */
  options: RoomRef[];
}

export type TeamStep = RoomTransitionStep | LocationTransitionStep | QuestionStep;

/** Аудитории шага: скан любой из них переводит команду на этот шаг. */
export function getStepOptions(step: TeamStep): RoomRef[] {
  if (step.kind === StepKind.ROOM_TRANSITION) {
    return [];
  }
  return step.options ?? [];
}
