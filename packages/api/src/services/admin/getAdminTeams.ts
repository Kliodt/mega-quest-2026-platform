import { type AdminTeamsDto } from '@quest/shared';
import { toAdminTeamsDto } from '../../utils/team/toAdminTeamsDto.js';
import { readRatingTeams } from '../rating/readRatingTeams.js';

export async function getAdminTeams(now = new Date()): Promise<AdminTeamsDto> {
  return toAdminTeamsDto(await readRatingTeams(), now);
}
