import { TimeAdjustmentType } from '@quest/shared';

export const TIME_ADJUSTMENT_TYPE_LABEL: Record<TimeAdjustmentType, string> = {
  [TimeAdjustmentType.WRONG_ANSWER]: 'неверный ответ',
  [TimeAdjustmentType.HINT]: 'подсказка',
  [TimeAdjustmentType.PENALTY]: 'штраф организатора',
  [TimeAdjustmentType.COMPENSATION]: 'компенсация',
  [TimeAdjustmentType.OTHER]: 'другое',
};
