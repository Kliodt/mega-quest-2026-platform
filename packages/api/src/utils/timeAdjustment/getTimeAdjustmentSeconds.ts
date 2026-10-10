import { type TimeAdjustment } from '../../models/Team.js';

/** Сумма всех поправок времени команды; бонусы отрицательные, итог может быть меньше нуля. */
export function getTimeAdjustmentSeconds(adjustments: TimeAdjustment[]): number {
  return adjustments.reduce((sum, adjustment) => sum + adjustment.timeAdjustmentSeconds, 0);
}
