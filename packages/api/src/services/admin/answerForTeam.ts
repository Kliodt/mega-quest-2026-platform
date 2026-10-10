import { type AdminTeamDetailDto } from '@quest/shared';
import { TeamModel } from '../../models/Team.js';
import { TeamNotFoundError } from '../../utils/errors/index.js';
import { acceptAnswer } from '../openQuestion/acceptAnswer.js';
import { requireOpenQuestion } from '../openQuestion/requireOpenQuestion.js';
import { readAdminTeamDetail } from './readAdminTeamDetail.js';

const ADMIN_ANSWER = { text: 'ответ засчитан организатором' };

/**
 * Организатор отвечает за команду: вопрос засчитан верным ответом, команда идёт дальше.
 * Так выручают, когда задание сломалось, а держать команду на нём незачем. Попытка
 * остаётся в журнале шага, поэтому видно, что ответ пришёл не от команды.
 */
export async function answerForTeam(
  teamId: string,
  now = new Date(),
): Promise<AdminTeamDetailDto> {
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw new TeamNotFoundError();
  }
  const { state } = await requireOpenQuestion(team);
  const current = await acceptAnswer(team, state._id, ADMIN_ANSWER, now);
  return readAdminTeamDetail(current, now);
}
