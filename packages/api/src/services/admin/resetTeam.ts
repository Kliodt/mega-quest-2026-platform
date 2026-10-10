import { QuestionStateModel } from '../../models/QuestionState.js';
import { TeamModel } from '../../models/Team.js';
import { TeamNotFoundError } from '../../utils/errors/index.js';

export async function resetTeam(teamId: string): Promise<void> {
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw new TeamNotFoundError();
  }
  await QuestionStateModel.deleteMany({ teamId: team._id });
  team.currentStepIndex = 0;
  team.sessionId = null;
  team.timeAdjustments = [];
  await team.save();
}
