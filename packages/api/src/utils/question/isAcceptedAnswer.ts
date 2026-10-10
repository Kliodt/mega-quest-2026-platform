import { type BasicAnswerDto } from '@quest/shared';
import { MOCK_CODE } from '../../config/env.js';
import { type Question } from '../../models/questionFields.js';
import { normalizeAnswer } from './normalizeAnswer.js';

/** Ответ `{ text }`; чужая форма — неверный ответ, не ошибка. Тестовый код подходит всегда. */
export function isAcceptedAnswer(question: Question, answer: unknown): boolean {
  const text = readAnswerText(answer);
  if (text === null) {
    return false;
  }
  const normalized = normalizeAnswer(text);
  if (MOCK_CODE !== null && normalized === normalizeAnswer(MOCK_CODE)) {
    return true;
  }
  return question.acceptedAnswers.some((accepted) => normalizeAnswer(accepted.html) === normalized);
}

function readAnswerText(answer: unknown): string | null {
  if (typeof answer !== 'object' || answer === null) {
    return null;
  }
  const text = (answer as Partial<BasicAnswerDto>).text;
  if (typeof text !== 'string') {
    return null;
  }
  return text;
}
