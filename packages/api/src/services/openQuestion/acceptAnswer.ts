import { type Types } from 'mongoose';
import { QuestionStateModel } from '../../models/QuestionState.js';
import { type TeamDocument } from '../../models/Team.js';
import { hasQuestionsAhead } from '../../utils/sequence/hasQuestionsAhead.js';
import { advanceTeam } from '../quest/advanceTeam.js';
import { finishTeam } from '../quest/finishTeam.js';

/**
 * Ответ засчитан: вопрос закрыт, команда продвинута. Так заканчивается и верный ответ
 * команды, и сигнал внешнего механизма — в обоих случаях проверять уже нечего.
 * Ответ на последнем вопросе маршрута закрывает весь квест: впереди одни переходы,
 * сканировать больше нечего.
 */
export async function acceptAnswer(
  team: TeamDocument,
  stateId: Types.ObjectId,
  payload: unknown,
  now: Date,
): Promise<TeamDocument> {
  // Условный update защищает от двойного сабмита: верная попытка запишется один раз
  await QuestionStateModel.updateOne(
    { _id: stateId, answeredAt: null },
    {
      $set: { answeredAt: now },
      $push: { attempts: { submittedAt: now, payload, correct: true } },
    },
  );
  // Вопрос мог закрыть параллельный запрос; шаг всё равно закрыт, и команду двигает тот,
  // кто успел первым: условный сдвиг по `currentStepIndex` не даст сделать это дважды
  const advanced = await advanceTeam(team, team.currentStepIndex);
  if (
    advanced.currentStepIndex >= advanced.sequence.length ||
    hasQuestionsAhead(advanced.sequence, advanced.currentStepIndex)
  ) {
    return advanced;
  }
  return finishTeam(advanced);
}
