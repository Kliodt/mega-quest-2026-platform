import { type GameQuestion, type GameTypeDefinition } from '../../games/types.js';
import { type Question } from '../../models/questionFields.js';
import { isAcceptedAnswer } from './isAcceptedAnswer.js';
import { toBasicQuestionContentDto } from './toBasicQuestionContentDto.js';
import { toQuestionFieldDto } from './toQuestionFieldDto.js';

/** Умолчания: содержимое — само задание, ответ `{ text }` против `acceptedAnswers`. */
export function toGameQuestion(definition: GameTypeDefinition, question: Question): GameQuestion {
  const toPublicContent = definition.toPublicContent ?? toBasicQuestionContentDto;
  const checkAnswer = definition.checkAnswer ?? isAcceptedAnswer;

  return {
    hints: question.hints.map((hint) => ({
      ...toQuestionFieldDto(hint),
      penaltySeconds: hint.penaltySeconds,
    })),
    wrongAttemptPenaltySeconds: question.wrongAttemptPenaltySeconds,
    toPublicContent: () => toPublicContent(question),
    checkAnswer: (answer) => checkAnswer(question, answer),
  };
}
