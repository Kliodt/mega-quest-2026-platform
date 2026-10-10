import { type TeamStep } from '@quest/shared';
import { type TeamDocument } from '../../models/Team.js';

export function getCurrentStep(team: TeamDocument): TeamStep | undefined {
  return team.sequence[team.currentStepIndex];
}
