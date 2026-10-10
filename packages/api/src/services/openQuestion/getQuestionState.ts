import { type QuestionStateDto } from '@quest/shared';
import { type TeamDocument } from '../../models/Team.js';
import { toQuestionStateDto } from '../../utils/question/toQuestionStateDto.js';
import { requireOpenQuestion } from './requireOpenQuestion.js';
import { waitForQuestionState } from './waitForQuestionState.js';

/**
 * Состояние прохождения открытого вопроса. С меткой последнего известного изменения
 * ждёт следующего: так игры, где ответ засчитывает внешний механизм, обходятся без опроса.
 */
export async function getQuestionState(
  team: TeamDocument,
  since?: string,
): Promise<QuestionStateDto> {
  if (since !== undefined) {
    return waitForQuestionState(team, since);
  }
  const { state } = await requireOpenQuestion(team);
  return toQuestionStateDto(state);
}
