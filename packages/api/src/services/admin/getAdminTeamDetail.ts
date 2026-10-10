import { type AdminTeamDetailDto } from '@quest/shared';
import { TeamModel } from '../../models/Team.js';
import { TeamNotFoundError } from '../../utils/errors/index.js';
import { readAdminTeamDetail } from './readAdminTeamDetail.js';

export async function getAdminTeamDetail(
  teamId: string,
  now = new Date(),
): Promise<AdminTeamDetailDto> {
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw new TeamNotFoundError();
  }
  return readAdminTeamDetail(team, now);
}
