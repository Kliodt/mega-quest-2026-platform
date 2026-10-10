import { QuestionStateModel, type QuestionStateDocument } from '../../models/QuestionState.js';
import { type TeamDocument } from '../../models/Team.js';

export async function readOpenState(team: TeamDocument): Promise<QuestionStateDocument | null> {
  return QuestionStateModel.findOne({ teamId: team._id, stepIndex: team.currentStepIndex });
}
