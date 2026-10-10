import { type QuestionStateDto } from '@quest/shared';

interface QuestionStateInput {
  state: unknown;
  updatedAt: Date;
}

/** Промежуточное состояние прохождения; null, пока команда ничего не сохраняла. */
export function toQuestionStateDto({ state, updatedAt }: QuestionStateInput): QuestionStateDto {
  return { state: state ?? null, updatedAt: updatedAt.toISOString() };
}
