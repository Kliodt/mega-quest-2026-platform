import { type HintDto, type QuestionViewDto } from '@quest/shared';
import { type GameQuestionHint } from '../../games/types.js';
import { type HintTaken } from '../../models/QuestionState.js';
import { getStepTimeAdjustmentSeconds } from '../timeAdjustment/getStepTimeAdjustmentSeconds.js';
import { type OpenQuestionContext } from './types.js';

/** Вопрос глазами команды: общая часть от core, `content` — от типа игры. */
export function toQuestionViewDto(open: OpenQuestionContext): QuestionViewDto {
  const { team, state, question } = open;
  const takenCount = state.hintsTaken.length;
  let nextHintIndex: number | null = null;
  if (takenCount < question.hints.length) {
    nextHintIndex = takenCount;
  }
  return {
    stepIndex: state.stepIndex,
    roomNumber: state.room.roomNumber,
    location: state.room.location,
    gameType: state.questionSnapshot.gameType,
    content: question.toPublicContent(),
    // Механика игры прячет ответ сама; остальным его знать нельзя
    answers: state.questionSnapshot.shouldSendAnswer
      ? state.questionSnapshot.acceptedAnswers.map((answer) => answer.html)
      : [],
    // Снимки, снятые до появления флага, его не знают
    waitsForExternalAnswer: state.questionSnapshot.waitsForExternalAnswer ?? false,
    hints: toHintDtos(question.hints, state.hintsTaken),
    nextHintIndex,
    attemptsCount: state.attempts.length,
    wrongAttemptsCount: state.attempts.filter((attempt) => !attempt.correct).length,
    wrongAttemptPenaltySeconds: question.wrongAttemptPenaltySeconds,
    stepTimeAdjustmentSeconds: getStepTimeAdjustmentSeconds(team.timeAdjustments, state.stepIndex),
    state: state.state ?? null,
  };
}

/** Содержимое подсказки уходит команде только после того, как она взята. */
function toHintDtos(hints: GameQuestionHint[], taken: HintTaken[]): HintDto[] {
  const takenIndexes = new Set(taken.map((hint) => hint.index));
  return hints.map((hint, index) => {
    const base = { index, penaltySeconds: hint.penaltySeconds };
    if (!takenIndexes.has(index)) {
      return { ...base, taken: false, html: null };
    }
    return { ...base, taken: true, html: hint.html, data: hint.data };
  });
}
