import { StepKind, type Location, type TeamStep } from '@quest/shared';

/**
 * Корпус, из которого команда уходит на переходе. У первого шага маршрута его нет:
 * позади ещё ничего не пройдено.
 */
export function getPreviousQuestionLocation(
  sequence: TeamStep[],
  fromIndex: number,
): Location | null {
  for (let index = fromIndex - 1; index >= 0; index -= 1) {
    const step = sequence[index];
    if (step?.kind === StepKind.QUESTION) {
      return step.options[0]?.location ?? null;
    }
  }
  return null;
}
