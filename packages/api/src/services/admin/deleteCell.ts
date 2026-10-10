import { type AdminCellsDto } from '@quest/shared';
import { QuestionModel } from '../../models/Question.js';
import { UnknownCellCodeError } from '../../utils/errors/index.js';
import { getAdminCells } from './getAdminCells.js';

/** Убирает код клетки: клетка остаётся, но выбрать её будет нечем. */
export async function deleteCell(code: string): Promise<AdminCellsDto> {
  const { modifiedCount } = await QuestionModel.updateOne(
    { 'cells.code': code },
    { $pull: { cells: { code } } },
  );
  if (modifiedCount === 0) {
    throw new UnknownCellCodeError();
  }
  return getAdminCells();
}
