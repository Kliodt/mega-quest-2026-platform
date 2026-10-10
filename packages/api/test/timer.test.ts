import { StepKind } from '@quest/shared';
import { describe, expect, it } from 'vitest';
import { toTimerDto } from '../src/utils/timer/toTimerDto.js';
import { type TimerStep } from '../src/utils/timer/types.js';

const t = (seconds: number): Date => new Date(1_700_000_000_000 + seconds * 1000);

function transition(kind: StepKind.LOCATION_TRANSITION | StepKind.ROOM_TRANSITION): TimerStep {
  return { kind, openedAt: null, answeredAt: null };
}

function question(openedAt: Date | null, answeredAt: Date | null): TimerStep {
  return { kind: StepKind.QUESTION, openedAt, answeredAt };
}

describe('toTimerDto', () => {
  it('returns zeros and not running before the quest starts', () => {
    const steps = [transition(StepKind.LOCATION_TRANSITION), question(null, null)];
    expect(toTimerDto(steps, 0, t(100), 0)).toEqual({
      elapsedSeconds: 0,
      timeAdjustmentSeconds: 0,
      totalSeconds: 0,
      running: false,
    });
  });

  it('runs while a question is open', () => {
    const steps = [transition(StepKind.LOCATION_TRANSITION), question(t(10), null)];
    const timer = toTimerDto(steps, 1, t(70), 0);
    expect(timer.elapsedSeconds).toBe(60);
    expect(timer.running).toBe(true);
  });

  it('counts time on ROOM_TRANSITION from previous answer until now', () => {
    const steps = [
      transition(StepKind.LOCATION_TRANSITION),
      question(t(0), t(100)),
      transition(StepKind.ROOM_TRANSITION),
      question(null, null),
    ];
    const timer = toTimerDto(steps, 2, t(130), 0);
    expect(timer.elapsedSeconds).toBe(130);
    expect(timer.running).toBe(true);
  });

  it('pauses on LOCATION_TRANSITION and freezes elapsed at previous answer', () => {
    const steps = [
      transition(StepKind.LOCATION_TRANSITION),
      question(t(0), t(100)),
      transition(StepKind.LOCATION_TRANSITION),
      question(null, null),
    ];
    const timer = toTimerDto(steps, 2, t(500), 0);
    expect(timer.elapsedSeconds).toBe(100);
    expect(timer.running).toBe(false);
  });

  it('stops when the quest is finished', () => {
    const steps = [transition(StepKind.LOCATION_TRANSITION), question(t(0), t(45))];
    const timer = toTimerDto(steps, 2, t(9999), 0);
    expect(timer.elapsedSeconds).toBe(45);
    expect(timer.running).toBe(false);
  });

  it('handles a three-question route across two locations', () => {
    const steps = [
      transition(StepKind.LOCATION_TRANSITION),
      question(t(0), t(60)),
      transition(StepKind.ROOM_TRANSITION),
      question(t(90), t(150)),
      transition(StepKind.LOCATION_TRANSITION),
      question(t(1000), null),
    ];
    const timer = toTimerDto(steps, 5, t(1030), 0);
    expect(timer.elapsedSeconds).toBe(60 + 30 + 60 + 30);
    expect(timer.running).toBe(true);
  });

  it('adds the time adjustments to the total', () => {
    const steps = [
      transition(StepKind.LOCATION_TRANSITION),
      question(t(0), t(60)),
      transition(StepKind.LOCATION_TRANSITION),
      question(t(100), t(160)),
    ];
    const timer = toTimerDto(steps, 4, t(200), 75);
    expect(timer.elapsedSeconds).toBe(120);
    expect(timer.timeAdjustmentSeconds).toBe(75);
    expect(timer.totalSeconds).toBe(195);
  });

  it('never lets the total drop below zero on a large bonus', () => {
    const steps = [transition(StepKind.LOCATION_TRANSITION), question(t(0), t(60))];
    const compensated = toTimerDto(steps, 2, t(100), -200);
    expect(compensated.timeAdjustmentSeconds).toBe(-200);
    expect(compensated.totalSeconds).toBe(0);
  });
});
