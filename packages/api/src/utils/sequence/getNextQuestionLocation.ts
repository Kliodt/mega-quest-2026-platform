import { StepKind, type Location, type TeamStep } from '@quest/shared';

/**
 * Корпус ближайшего следующего вопроса. Им подписан переход между корпусами: и карточка
 * маршрута, и текст, который команда читает по дороге. У финишного перехода вопросов
 * впереди нет, поэтому корпуса у него тоже нет.
 */
export function getNextQuestionLocation(sequence: TeamStep[], fromIndex: number): Location | null {
  for (let index = fromIndex + 1; index < sequence.length; index += 1) {
    const step = sequence[index];
    if (step?.kind === StepKind.QUESTION) {
      return step.options[0]?.location ?? null;
    }
  }
  return null;
}
