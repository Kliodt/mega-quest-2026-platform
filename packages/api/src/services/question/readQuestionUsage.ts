import { type Types } from 'mongoose';
import { QuestionStateModel } from '../../models/QuestionState.js';
import { type QuestionUsage } from '../../utils/question/types.js';

/** Кем и когда были заняты эти вопросы: по одной записи на вопрос, по последней выдаче. */
export async function readQuestionUsage(questionIds: Types.ObjectId[]): Promise<QuestionUsage[]> {
  const states = await QuestionStateModel.find({ questionId: { $in: questionIds } })
    .select('questionId openedAt answeredAt')
    .lean();

  const byQuestion = new Map<string, QuestionUsage>();
  for (const state of states) {
    const questionId = state.questionId.toString();
    const usage = {
      questionId,
      busy: state.answeredAt === null,
      usedAt: state.answeredAt ?? state.openedAt,
    };
    const known = byQuestion.get(questionId);
    if (!known || isLater(usage, known)) {
      byQuestion.set(questionId, usage);
    }
  }
  return [...byQuestion.values()];
}

/** Занятость важнее давности: пока по вопросу идёт команда, он занят. */
function isLater(usage: QuestionUsage, known: QuestionUsage): boolean {
  if (usage.busy !== known.busy) {
    return usage.busy;
  }
  return usage.usedAt.getTime() > known.usedAt.getTime();
}
