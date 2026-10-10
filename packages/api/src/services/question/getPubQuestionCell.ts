import { type PubQuestionCellDto } from '@quest/shared';
import { UnknownCellCodeError } from '../../utils/errors/index.js';
import { readQuestionCell } from './readQuestionCell.js';

/**
 * Какая клетка поля за этим кодом. Роут открытый: коды клеток расклеены в аудитории,
 * их сканирует и команда по ходу игры, и организатор, когда проверяет раскладку.
 */
export async function getPubQuestionCell(code: string): Promise<PubQuestionCellDto> {
  const cell = await readQuestionCell(code);
  if (!cell) {
    throw new UnknownCellCodeError();
  }
  return { row: cell.row, col: cell.col };
}
