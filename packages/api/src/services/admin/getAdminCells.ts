import { type AdminCellsDto } from '@quest/shared';
import { QuestionModel } from '../../models/Question.js';
import { toAdminCellDtos } from '../../utils/question/toAdminCellDtos.js';

/** Коды клеток всех вопросов, у которых поле из клеток: у сапёра это его раскладка. */
export async function getAdminCells(): Promise<AdminCellsDto> {
  const questions = await QuestionModel.find({ 'cells.0': { $exists: true } })
    .select('rooms cells')
    .sort({ 'rooms.0.location': 1, 'rooms.0.roomNumber': 1 })
    .lean();
  const cells = toAdminCellDtos(questions).sort(
    (first, second) => first.row - second.row || first.col - second.col,
  );
  return { cells };
}
