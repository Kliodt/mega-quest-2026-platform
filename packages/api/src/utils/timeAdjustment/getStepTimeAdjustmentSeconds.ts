import { type TimeAdjustment } from '../../models/Team.js';

export function getStepTimeAdjustmentSeconds(
  adjustments: TimeAdjustment[],
  stepIndex: number,
): number {
  return adjustments
    .filter((adjustment) => adjustment.stepIndex === stepIndex)
    .reduce((sum, adjustment) => sum + adjustment.timeAdjustmentSeconds, 0);
}
