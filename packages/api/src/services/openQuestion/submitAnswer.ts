import { TimeAdjustmentType, type AnswerResultDto } from '@quest/shared';
import { QuestionStateModel } from '../../models/QuestionState.js';
import { type TeamDocument } from '../../models/Team.js';
import { getProgress } from '../quest/getProgress.js';
import { recordTimeAdjustment } from '../quest/recordTimeAdjustment.js';
import { acceptAnswer } from './acceptAnswer.js';
import { requireOpenQuestion } from './requireOpenQuestion.js';

/** Неверно — попытка со штрафом, верно — вопрос закрыт и команда продвинута. */
export async function submitAnswer(
  team: TeamDocument,
  answer: unknown,
  now = new Date(),
): Promise<AnswerResultDto> {
  const { state, question } = await requireOpenQuestion(team);

  if (!question.checkAnswer(answer)) {
    const penaltySecondsAdded = question.wrongAttemptPenaltySeconds;
    await QuestionStateModel.updateOne(
      { _id: state._id },
      { $push: { attempts: { submittedAt: now, payload: answer, correct: false } } },
    );
    const penalised = await recordTimeAdjustment(
      team,
      {
        timeAdjustmentSeconds: penaltySecondsAdded,
        type: TimeAdjustmentType.WRONG_ANSWER,
        comment: null,
        stepIndex: state.stepIndex,
      },
      now,
    );
    return { correct: false, penaltySecondsAdded, progress: await getProgress(penalised, now) };
  }

  const current = await acceptAnswer(team, state._id, answer, now);
  return { correct: true, penaltySecondsAdded: 0, progress: await getProgress(current, now) };
}
