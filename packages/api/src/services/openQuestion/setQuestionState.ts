import { type QuestionStateDto } from '@quest/shared';
import { QuestionStateModel } from '../../models/QuestionState.js';
import { type TeamDocument } from '../../models/Team.js';
import { toQuestionStateDto } from '../../utils/question/toQuestionStateDto.js';
import { requireOpenQuestion } from './requireOpenQuestion.js';

/** Сохраняет состояние прохождения как есть, если тип игры его не преобразует. */
export async function setQuestionState(
  team: TeamDocument,
  next: unknown,
): Promise<QuestionStateDto> {
  const { state, question, definition } = await requireOpenQuestion(team);
  let accepted = next;
  if (definition.onStateUpdate) {
    accepted = definition.onStateUpdate(question, state.state ?? null, next);
  }
  const saved = await QuestionStateModel.findOneAndUpdate(
    { _id: state._id },
    { $set: { state: accepted } },
    { returnDocument: 'after' },
  );
  return toQuestionStateDto(saved ?? { state: accepted, updatedAt: new Date() });
}
