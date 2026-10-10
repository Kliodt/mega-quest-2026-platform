import { TeamStatus } from '@quest/shared';
import { type Team } from '../../models/Team.js';

export function getTeamStatus(team: Pick<Team, 'sequence' | 'currentStepIndex'>): TeamStatus {
  if (team.currentStepIndex === 0) {
    return TeamStatus.NOT_STARTED;
  }
  if (team.currentStepIndex >= team.sequence.length) {
    return TeamStatus.FINISHED;
  }
  return TeamStatus.IN_PROGRESS;
}
