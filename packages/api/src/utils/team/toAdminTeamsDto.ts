import { type AdminTeamsDto } from '@quest/shared';
import { InternalError } from '../errors/index.js';
import { toRatingDto } from '../rating/toRatingDto.js';
import { type RatingTeamInput } from '../rating/types.js';

/** Список команд для админки: цифры рейтинга плюс положение каждой на маршруте. */
export function toAdminTeamsDto(teams: RatingTeamInput[], now: Date): AdminTeamsDto {
  const byId = new Map(teams.map((team) => [team.id, team]));
  const rating = toRatingDto(teams, now);
  return {
    generatedAt: rating.generatedAt,
    teams: rating.entries.map((entry) => {
      const team = byId.get(entry.teamId);
      if (!team) {
        throw new InternalError({ teamId: entry.teamId, reason: 'Rating entry without a team' });
      }
      return {
        ...entry,
        currentStepIndex: team.currentStepIndex,
        totalSteps: team.sequence.length,
        sequence: team.sequence,
      };
    }),
  };
}
