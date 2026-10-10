import { type AdminValidationDto } from '@quest/shared';
import { TeamModel } from '../../models/Team.js';
import { validateSequence } from '../../utils/sequence/validateSequence.js';
import { readSequenceQuestions } from '../question/readSequenceQuestions.js';

/**
 * Сходятся ли маршруты всех команд с вопросами в базе. Гоняется при старте API
 * и в любой момент из админки: вопросы и маршруты правятся по ходу подготовки.
 */
export async function validateAllTeamSequences(): Promise<AdminValidationDto> {
  const lookup = await readSequenceQuestions();
  const teams = await TeamModel.find().lean();

  const problems = teams
    .map((team) => ({
      teamId: team._id.toString(),
      teamName: team.name,
      result: validateSequence(team.sequence, lookup, team.slug),
    }))
    .filter(({ result }) => !result.ok)
    .map(({ teamId, teamName, result }) => ({ teamId, teamName, errors: result.errors }));

  return { ok: problems.length === 0, checkedTeams: teams.length, problems };
}
