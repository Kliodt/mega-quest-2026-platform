import { StepKind } from '@quest/shared';
import { gameTypeRegistry } from '../../games/registry.js';
import { type QuestionStateDocument } from '../../models/QuestionState.js';
import { type TeamDocument } from '../../models/Team.js';
import { toGameQuestion } from '../../utils/question/toGameQuestion.js';
import { type OpenQuestionContext } from '../../utils/question/types.js';
import { getCurrentStep } from '../../utils/team/getCurrentStep.js';
import { readOpenState } from '../quest/readOpenState.js';

/** Открытый вопрос команды или null вне фазы вопроса. */
export async function readOpenQuestion(
  team: TeamDocument,
  states?: QuestionStateDocument[],
): Promise<OpenQuestionContext | null> {
  if (getCurrentStep(team)?.kind !== StepKind.QUESTION) {
    return null;
  }
  const state = states
    ? states.find((candidate) => candidate.stepIndex === team.currentStepIndex)
    : await readOpenState(team);
  if (!state) {
    return null;
  }
  const definition = gameTypeRegistry[state.questionSnapshot.gameType];
  return { team, state, question: toGameQuestion(definition, state.questionSnapshot), definition };
}
