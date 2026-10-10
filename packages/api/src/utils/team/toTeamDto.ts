import { type TeamDto } from '@quest/shared';
import { type TeamDocument } from '../../models/Team.js';
import { getTeamStatus } from './getTeamStatus.js';

export function toTeamDto(team: TeamDocument): TeamDto {
  return {
    id: team.id,
    name: team.name,
    status: getTeamStatus(team),
  };
}
