import { type AdminTeamDetailDto } from '@quest/shared';
import { type TeamDocument } from '../../models/Team.js';
import { getTeamStatus } from '../../utils/team/getTeamStatus.js';
import { toAdminTeamDetailDto } from '../../utils/team/toAdminTeamDetailDto.js';
import { readQuestContext } from '../quest/readQuestContext.js';

/** Карта команды для организатора по уже загруженной команде. */
export async function readAdminTeamDetail(
  team: TeamDocument,
  now = new Date(),
): Promise<AdminTeamDetailDto> {
  const context = await readQuestContext(team);
  return toAdminTeamDetailDto({
    team: {
      id: team.id,
      name: team.name,
      status: getTeamStatus(team),
      sequence: team.sequence,
      currentStepIndex: team.currentStepIndex,
    },
    states: context.states,
    questionsByRoom: context.questionsByRoom,
    timeAdjustments: team.timeAdjustments,
    now,
  });
}
