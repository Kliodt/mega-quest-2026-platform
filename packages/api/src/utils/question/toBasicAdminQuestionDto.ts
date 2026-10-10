import { type BasicAdminQuestionDto } from '@quest/shared';
import { type Question } from '../../models/questionFields.js';
import { toQuestionFieldDto } from './toQuestionFieldDto.js';

/** Вопрос глазами организатора по умолчанию: с правильными ответами и содержимым подсказок. */
export function toBasicAdminQuestionDto(question: Question): BasicAdminQuestionDto {
  return {
    ...toQuestionFieldDto(question),
    acceptedAnswers: question.acceptedAnswers.map(toQuestionFieldDto),
    wrongAttemptPenaltySeconds: question.wrongAttemptPenaltySeconds,
    answerIsNextRoom: question.answerIsNextRoom,
    hasDynamicAnswer: question.hasDynamicAnswer,
    hints: question.hints.map((hint) => ({
      ...toQuestionFieldDto(hint),
      penaltySeconds: hint.penaltySeconds,
    })),
  };
}
