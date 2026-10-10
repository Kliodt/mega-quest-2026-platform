import { type AdminTeamDetailDto } from '@quest/shared';
import { TeamModel } from '../../models/Team.js';
import { TeamNotFoundError, TimeAdjustmentNotFoundError } from '../../utils/errors/index.js';
import { readAdminTeamDetail } from './readAdminTeamDetail.js';

/** Отменяет любую поправку времени, в том числе автоматическую. */
export async function deleteTimeAdjustment(
  teamId: string,
  timeAdjustmentId: string,
): Promise<AdminTeamDetailDto> {
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw new TeamNotFoundError();
  }
  const kept = team.timeAdjustments.filter(
    (adjustment) => adjustment._id.toString() !== timeAdjustmentId,
  );
  if (kept.length === team.timeAdjustments.length) {
    throw new TimeAdjustmentNotFoundError();
  }
  team.timeAdjustments = kept;
  await team.save();
  return readAdminTeamDetail(team);
}
