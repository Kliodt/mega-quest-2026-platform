import { type TimeAdjustmentDto } from '@quest/shared';
import { type TimeAdjustment } from '../../models/Team.js';

/** Поправки времени по порядку создания. */
export function toTimeAdjustmentDtos(adjustments: TimeAdjustment[]): TimeAdjustmentDto[] {
  return [...adjustments]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((adjustment) => ({
      id: adjustment._id.toString(),
      timeAdjustmentSeconds: adjustment.timeAdjustmentSeconds,
      type: adjustment.type,
      createdAt: adjustment.createdAt.toISOString(),
      comment: adjustment.comment,
      stepIndex: adjustment.stepIndex,
    }));
}
