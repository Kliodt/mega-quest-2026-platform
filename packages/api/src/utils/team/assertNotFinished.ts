import { type TeamDocument } from '../../models/Team.js';
import { QuestFinishedError } from '../errors/index.js';

export function assertNotFinished(team: TeamDocument): void {
  if (team.currentStepIndex >= team.sequence.length) {
    throw new QuestFinishedError();
  }
}
