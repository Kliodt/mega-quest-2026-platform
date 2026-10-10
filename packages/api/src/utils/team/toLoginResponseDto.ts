import { type LoginResponseDto } from '@quest/shared';
import { type TeamDocument } from '../../models/Team.js';
import { toTeamDto } from './toTeamDto.js';

export function toLoginResponseDto(token: string, team: TeamDocument): LoginResponseDto {
  return { token, team: toTeamDto(team) };
}
