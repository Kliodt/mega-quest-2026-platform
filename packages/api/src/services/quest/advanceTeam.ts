import { TeamModel, type TeamDocument } from '../../models/Team.js';
import { readTeam } from './readTeam.js';

/** Сдвигает команду на следующий шаг, только если она всё ещё на `fromIndex`. */
export async function advanceTeam(team: TeamDocument, fromIndex: number): Promise<TeamDocument> {
  const advanced = await TeamModel.findOneAndUpdate(
    { _id: team._id, currentStepIndex: fromIndex },
    { $set: { currentStepIndex: fromIndex + 1 } },
    { returnDocument: 'after' },
  );
  return advanced ?? readTeam(team);
}
