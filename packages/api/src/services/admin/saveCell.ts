import { type AdminCellsDto, type AdminSaveCellRequestDto } from '@quest/shared';
import { QuestionModel } from '../../models/Question.js';
import { CellQuestionNotFoundError, CellTakenError } from '../../utils/errors/index.js';
import { getAdminCells } from './getAdminCells.js';

/**
 * Заводит код клетки или переносит его на другую клетку, в том числе в другой вопрос:
 * код уникален на весь квест, а у клетки код один.
 */
export async function saveCell(body: AdminSaveCellRequestDto): Promise<AdminCellsDto> {
  const { code, location, roomNumber, row, col } = body;
  const target = await QuestionModel.findOne({
    rooms: { $elemMatch: { location, roomNumber } },
  });
  if (!target) {
    throw new CellQuestionNotFoundError({ location, roomNumber });
  }

  const taken = target.cells.find((cell) => cell.row === row && cell.col === col);
  if (taken && taken.code !== code) {
    throw new CellTakenError({ row, col }, taken.code);
  }

  // Код мог висеть на другой клетке — хоть в этом вопросе, хоть в соседнем: снимаем его оттуда
  await QuestionModel.updateMany({ 'cells.code': code }, { $pull: { cells: { code } } });
  await QuestionModel.updateOne({ _id: target._id }, { $push: { cells: { code, row, col } } });

  return getAdminCells();
}
