import { GameType } from '@quest/shared';
import { type GameTypeDefinition } from '../types.js';

/**
 * Кнопки и мелодия живут вне платформы; ответ засчитывает внешний механизм,
 * меняя состояние прохождения. Команда на экране просто ждёт этого изменения.
 */
export const soundButtonsGameType: GameTypeDefinition = {
  gameType: GameType.SOUND_BUTTONS,
};
