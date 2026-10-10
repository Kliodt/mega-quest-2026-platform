import { GameType } from '@quest/shared';
import { type GameTypeDefinition } from '../types.js';

/**
 * Номер следующей аудитории команда получает как ответ (`shouldSendAnswer`)
 * и сама прячет его в адрес страницы. Своей механики у типа нет.
 */
export const historyGameType: GameTypeDefinition = {
  gameType: GameType.HISTORY,
};
