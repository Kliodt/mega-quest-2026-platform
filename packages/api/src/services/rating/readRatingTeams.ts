import { QuestionStateModel } from '../../models/QuestionState.js';
import { TeamModel } from '../../models/Team.js';
import { type ProgressStateInput } from '../../utils/progress/types.js';
import { type RatingTeamInput } from '../../utils/rating/types.js';

/** Все команды с их состояниями двумя запросами; вход для toRatingDto. */
export async function readRatingTeams(): Promise<RatingTeamInput[]> {
  const [teams, states] = await Promise.all([TeamModel.find(), QuestionStateModel.find()]);
  const statesByTeam = groupByTeam<ProgressStateInput>(states);
  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    sequence: team.sequence,
    currentStepIndex: team.currentStepIndex,
    states: statesByTeam.get(team.id) ?? [],
    timeAdjustments: team.timeAdjustments,
  }));
}

function groupByTeam<T>(items: (T & { teamId: { toString(): string } })[]): Map<string, T[]> {
  const byTeam = new Map<string, T[]>();
  for (const item of items) {
    const key = item.teamId.toString();
    const list = byTeam.get(key) ?? [];
    list.push(item);
    byTeam.set(key, list);
  }
  return byTeam;
}
