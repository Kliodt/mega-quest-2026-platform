import { type StepKind } from '@quest/shared';

export interface TimerStep {
  kind: StepKind;
  openedAt: Date | null;
  answeredAt: Date | null;
}
