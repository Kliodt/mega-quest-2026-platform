import { QuestionModel } from '../../models/Question.js';
import { type QuestionCell } from '../../models/questionFields.js';

/** Клетка поля за кодом; коды клеток уникальны на все вопросы, это проверяет загрузчик. */
export async function readQuestionCell(code: string): Promise<QuestionCell | null> {
  const question = await QuestionModel.findOne({ 'cells.code': code })
    .select('cells')
    .lean<{ cells: QuestionCell[] }>();
  return question?.cells.find((cell) => cell.code === code) ?? null;
}
