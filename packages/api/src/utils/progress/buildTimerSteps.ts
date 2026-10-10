import { StepKind, type TeamStep } from '@quest/shared';
import { type TimerStep } from '../timer/types.js';
import { type StatesByIndex } from './types.js';

export function buildTimerSteps(sequence: TeamStep[], statesByIndex: StatesByIndex): TimerStep[] {
  return sequence.map((step, index) => {
    const state = statesByIndex.get(index);
    if (step.kind !== StepKind.QUESTION || !state) {
      return { kind: step.kind, openedAt: null, answeredAt: null };
    }
    return { kind: step.kind, openedAt: state.openedAt, answeredAt: state.answeredAt };
  });
}
