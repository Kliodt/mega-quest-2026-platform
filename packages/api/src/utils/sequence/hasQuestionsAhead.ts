import { StepKind, type TeamStep } from '@quest/shared';

/** Есть ли впереди ещё вопросы: если остались одни переходы, команде больше нечего открывать. */
export function hasQuestionsAhead(sequence: TeamStep[], fromIndex: number): boolean {
  return sequence.slice(fromIndex).some((step) => step.kind === StepKind.QUESTION);
}
