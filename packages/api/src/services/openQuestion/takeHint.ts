import { TimeAdjustmentType, type ProgressDto } from '@quest/shared';
import { QuestionStateModel } from '../../models/QuestionState.js';
import { type TeamDocument } from '../../models/Team.js';
import {
  HintMissingError,
  HintOrderViolationError,
  HintsExhaustedError,
} from '../../utils/errors/index.js';
import { getProgress } from '../quest/getProgress.js';
import { readTeam } from '../quest/readTeam.js';
import { recordTimeAdjustment } from '../quest/recordTimeAdjustment.js';
import { requireOpenQuestion } from './requireOpenQuestion.js';

/** Подсказки строго по порядку; повторный запрос взятой — no-op, штраф берётся один раз. */
export async function takeHint(
  team: TeamDocument,
  hintIndex: number,
  now = new Date(),
): Promise<ProgressDto> {
  const { state, question } = await requireOpenQuestion(team);
  const takenCount = state.hintsTaken.length;

  // Подсказку уже брали: штраф записан, но соседний запрос мог сдвинуть команду
  if (hintIndex < takenCount) {
    return getProgress(await readCharged(team, state.stepIndex, takenCount), now);
  }
  if (takenCount >= question.hints.length) {
    throw new HintsExhaustedError();
  }
  if (hintIndex !== takenCount) {
    throw new HintOrderViolationError(takenCount);
  }
  const hint = question.hints[hintIndex];
  if (!hint) {
    throw new HintMissingError(hintIndex);
  }

  const result = await QuestionStateModel.updateOne(
    { _id: state._id, [`hintsTaken.${hintIndex}`]: { $exists: false } },
    { $push: { hintsTaken: { index: hintIndex, takenAt: now } } },
  );
  if (result.modifiedCount !== 1) {
    return getProgress(await readCharged(team, state.stepIndex, takenCount + 1), now);
  }

  const penalised = await recordTimeAdjustment(
    team,
    {
      timeAdjustmentSeconds: hint.penaltySeconds,
      type: TimeAdjustmentType.HINT,
      comment: null,
      stepIndex: state.stepIndex,
    },
    now,
  );
  return getProgress(penalised, now);
}

/** Сколько раз команде уже начислили за подсказки этого шага */
function countHintAdjustments(team: TeamDocument, stepIndex: number): number {
  return team.timeAdjustments.filter(
    (adjustment) =>
      adjustment.type === TimeAdjustmentType.HINT && adjustment.stepIndex === stepIndex,
  ).length;
}

/** Сколько ждём соседний запрос: он пишет подсказку и штраф двумя записями подряд */
const CHARGE_WAIT_MS = 30;
const CHARGE_ATTEMPTS = 6;

/**
 * Команда с уже взятой подсказкой: ждём, пока штраф за неё окажется в документе. Иначе
 * запрос, проигравший гонку соседнему, вернул бы время без только что взятого штрафа.
 */
async function readCharged(
  team: TeamDocument,
  stepIndex: number,
  expected: number,
  attemptsLeft = CHARGE_ATTEMPTS,
): Promise<TeamDocument> {
  const fresh = await readTeam(team);
  if (countHintAdjustments(fresh, stepIndex) >= expected || attemptsLeft === 0) {
    return fresh;
  }
  await delay(CHARGE_WAIT_MS);
  return readCharged(team, stepIndex, expected, attemptsLeft - 1);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
