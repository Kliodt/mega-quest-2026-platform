import { type PubExternalAnswerDto } from '@quest/shared';
import { QuestionModel } from '../../models/Question.js';
import { QuestionStateModel } from '../../models/QuestionState.js';
import { TeamModel } from '../../models/Team.js';
import { NoWaitingTeamError, UnknownExternalCodeError } from '../../utils/errors/index.js';
import { acceptAnswer } from '../openQuestion/acceptAnswer.js';

/**
 * Сигнал внешнего механизма: он называет себя номером, а не командой, поэтому команду
 * ищем сами — ту, что открыла вопрос этого механизма и ещё не ответила. Если открыли
 * двое, ответ получает открывшая раньше: она и стоит в аудитории дольше.
 */
export async function confirmExternalAnswer(
  externalAnswerCode: number,
  now = new Date(),
): Promise<PubExternalAnswerDto> {
  const question = await QuestionModel.findOne({ externalAnswerCode });
  if (!question) {
    throw new UnknownExternalCodeError(externalAnswerCode);
  }

  const state = await QuestionStateModel.findOne({
    questionId: question._id,
    answeredAt: null,
  }).sort({ openedAt: 1 });
  if (!state) {
    throw new NoWaitingTeamError(externalAnswerCode);
  }

  const team = await TeamModel.findById(state.teamId);
  // Шаг команды и открытый вопрос разошлись: засчитывать нечего
  if (team?.currentStepIndex !== state.stepIndex) {
    throw new NoWaitingTeamError(externalAnswerCode);
  }

  await acceptAnswer(team, state._id, { text: `внешний сигнал ${externalAnswerCode}` }, now);
  return { teamName: team.name, roomNumber: state.room.roomNumber };
}
