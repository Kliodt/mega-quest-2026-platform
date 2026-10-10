import { describe, expect, it } from 'vitest';
import { computeDisplaySeconds } from './Timer.js';

const stopped = {
  elapsedSeconds: 90,
  timeAdjustmentSeconds: 30,
  totalSeconds: 120,
  running: false,
};
const running = { elapsedSeconds: 90, timeAdjustmentSeconds: 30, totalSeconds: 120, running: true };

describe('computeDisplaySeconds', () => {
  it('freezes on the server value while the clock is paused', () => {
    expect(computeDisplaySeconds(stopped, 1_000_000, 1_000_000 + 60_000)).toBe(90);
  });

  it('adds the time passed since the snapshot while the clock runs', () => {
    expect(computeDisplaySeconds(running, 1_000_000, 1_000_000 + 7_400)).toBe(97);
  });

  it('never goes backwards when the local clock lags behind the snapshot', () => {
    expect(computeDisplaySeconds(running, 1_000_000, 1_000_000 - 600_000)).toBe(90);
  });

  /** Поправки живут отдельной строкой под часами, в сами часы они не входят */
  it('keeps time adjustments out of the clock', () => {
    expect(computeDisplaySeconds(running, 1_000_000, 1_000_000)).toBe(running.elapsedSeconds);
  });
});
