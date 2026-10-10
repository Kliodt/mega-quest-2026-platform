import { type TimeAdjustmentDto } from '@quest/shared';
import { TIME_ADJUSTMENT_TYPE_LABEL } from './labels.js';

/** За что поправка времени: причина, аудитория шага и комментарий организатора. */
export function describeAdjustment(
  adjustment: TimeAdjustmentDto,
  roomNumbers: ReadonlyMap<number, string>,
): string {
  let text = TIME_ADJUSTMENT_TYPE_LABEL[adjustment.type];
  if (adjustment.stepIndex !== null) {
    const roomNumber = roomNumbers.get(adjustment.stepIndex);
    if (roomNumber !== undefined) {
      text = `${text}, ауд. ${roomNumber}`;
    }
  }
  if (adjustment.comment) {
    text = `${text}: ${adjustment.comment}`;
  }
  return text;
}
