import { getStepOptions, type RoomRef, type TeamStep } from '@quest/shared';

/**
 * Аудитории, куда команда пойдёт после этого шага: ближайший шаг маршрута со своими
 * аудиториями. Обычно это следующий вопрос, а в конце корпуса — переход между корпусами,
 * чей скан закрывает вопрос и останавливает время.
 */
export function getNextRooms(sequence: TeamStep[], fromIndex: number): RoomRef[] {
  for (let index = fromIndex + 1; index < sequence.length; index += 1) {
    const step = sequence[index];
    const options = step ? getStepOptions(step) : [];
    if (options.length > 0) {
      return options;
    }
  }
  return [];
}
