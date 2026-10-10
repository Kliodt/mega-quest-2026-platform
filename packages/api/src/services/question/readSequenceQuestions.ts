import { QuestionModel } from '../../models/Question.js';
import { toSequenceQuestions } from '../../utils/sequence/toSequenceQuestions.js';
import { type SequenceQuestionLookup } from '../../utils/sequence/types.js';

/** Вопросы для валидатора маршрута, прочитанные из базы. */
export async function readSequenceQuestions(): Promise<SequenceQuestionLookup> {
  return toSequenceQuestions(await QuestionModel.find().lean());
}
