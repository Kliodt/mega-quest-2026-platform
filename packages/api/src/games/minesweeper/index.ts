import { GameType, type MinesweeperQuestionContentDto } from '@quest/shared';
import { toQuestionFieldDto } from '../../utils/question/toQuestionFieldDto.js';
import { type GameTypeDefinition } from '../types.js';

/**
 * Игра идёт целиком на фронте: он знает размер поля и число мин и сам раскладывает
 * его так, чтобы решалось без угадываний. Бэкенду важен только исход — «0» или «1».
 * Клетку команда выбирает сканированием, поэтому коды клеток уходят вместе с заданием:
 * разбирать их на месте надёжнее, чем спрашивать сервер на каждый кадр.
 */
export const minesweeperGameType: GameTypeDefinition = {
  gameType: GameType.MINESWEEPER,
  toPublicContent: (question): MinesweeperQuestionContentDto => ({
    ...toQuestionFieldDto(question),
    cells: question.cells.map(({ code, row, col }) => ({ code, row, col })),
  }),
};
