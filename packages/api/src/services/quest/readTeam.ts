import { TeamModel, type TeamDocument } from '../../models/Team.js';
import { UnauthorizedError } from '../../utils/errors/index.js';

export async function readTeam(team: TeamDocument): Promise<TeamDocument> {
  const fresh = await TeamModel.findById(team._id);
  if (!fresh) {
    throw new UnauthorizedError();
  }
  return fresh;
}
