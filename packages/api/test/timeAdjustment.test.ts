import { TimeAdjustmentType } from '@quest/shared';
import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { type TimeAdjustment } from '../src/models/Team.js';
import { getStepTimeAdjustmentSeconds } from '../src/utils/timeAdjustment/getStepTimeAdjustmentSeconds.js';
import { getTimeAdjustmentSeconds } from '../src/utils/timeAdjustment/getTimeAdjustmentSeconds.js';
import { toTimeAdjustmentDtos } from '../src/utils/timeAdjustment/toTimeAdjustmentDtos.js';

const t = (seconds: number): Date => new Date(1_700_000_000_000 + seconds * 1000);

function adjustment(
  seconds: number,
  type: TimeAdjustmentType,
  createdAt: Date,
  stepIndex: number | null = null,
  comment: string | null = null,
): TimeAdjustment {
  return {
    _id: new Types.ObjectId(),
    timeAdjustmentSeconds: seconds,
    type,
    createdAt,
    comment,
    stepIndex,
  };
}

const adjustments: TimeAdjustment[] = [
  adjustment(45, TimeAdjustmentType.WRONG_ANSWER, t(50), 3),
  adjustment(30, TimeAdjustmentType.WRONG_ANSWER, t(10), 1),
  adjustment(60, TimeAdjustmentType.HINT, t(20), 1),
  adjustment(-90, TimeAdjustmentType.COMPENSATION, t(5), null, 'Сбой в аудитории'),
];

describe('getTimeAdjustmentSeconds', () => {
  it('sums penalties and bonuses; the total may be negative', () => {
    expect(getTimeAdjustmentSeconds(adjustments)).toBe(45);
    expect(getTimeAdjustmentSeconds([adjustments[3]!])).toBe(-90);
    expect(getTimeAdjustmentSeconds([])).toBe(0);
  });
});

describe('getStepTimeAdjustmentSeconds', () => {
  it('sums only the adjustments bound to the step', () => {
    expect(getStepTimeAdjustmentSeconds(adjustments, 1)).toBe(90);
    expect(getStepTimeAdjustmentSeconds(adjustments, 3)).toBe(45);
    expect(getStepTimeAdjustmentSeconds(adjustments, 5)).toBe(0);
  });
});

describe('toTimeAdjustmentDtos', () => {
  it('orders adjustments by creation time and keeps every field', () => {
    const dtos = toTimeAdjustmentDtos(adjustments);

    expect(dtos.map((dto) => dto.timeAdjustmentSeconds)).toEqual([-90, 30, 60, 45]);
    expect(dtos[0]).toEqual({
      id: adjustments[3]!._id.toString(),
      timeAdjustmentSeconds: -90,
      type: TimeAdjustmentType.COMPENSATION,
      createdAt: t(5).toISOString(),
      comment: 'Сбой в аудитории',
      stepIndex: null,
    });
    expect(dtos[2]).toMatchObject({
      type: TimeAdjustmentType.HINT,
      stepIndex: 1,
      comment: null,
    });
  });

  it('does not mutate the input order', () => {
    const copy = [...adjustments];
    toTimeAdjustmentDtos(adjustments);
    expect(adjustments).toEqual(copy);
  });
});
