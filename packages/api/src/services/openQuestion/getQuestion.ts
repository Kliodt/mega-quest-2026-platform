import { type QuestionViewDto } from '@quest/shared';
import { type TeamDocument } from '../../models/Team.js';
import { toQuestionViewDto } from '../../utils/question/toQuestionViewDto.js';
import { requireOpenQuestion } from './requireOpenQuestion.js';

export async function getQuestion(team: TeamDocument): Promise<QuestionViewDto> {
  return toQuestionViewDto(await requireOpenQuestion(team));
}
