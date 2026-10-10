import { TeamModel, type TeamDocument } from '../../models/Team.js';
import { readTeam } from './readTeam.js';

/** Ставит команду за последний шаг маршрута: квест закончен, ждать больше нечего. */
export async function finishTeam(team: TeamDocument): Promise<TeamDocument> {
  const finished = await TeamModel.findOneAndUpdate(
    { _id: team._id, currentStepIndex: team.currentStepIndex },
    { $set: { currentStepIndex: team.sequence.length } },
    { returnDocument: 'after' },
  );
  return finished ?? readTeam(team);
}
