import { type TeamStep } from '@quest/shared';
import { type TimeAdjustment } from '../../models/Team.js';
import { type ProgressStateInput } from '../progress/types.js';

export interface RatingTeamInput {
  id: string;
  name: string;
  sequence: TeamStep[];
  currentStepIndex: number;
  states: ProgressStateInput[];
  timeAdjustments: TimeAdjustment[];
}
