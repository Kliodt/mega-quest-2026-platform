import { StepKind, TimeAdjustmentType, type AdminTeamDetailDto } from '@quest/shared';
import { QuestionStateModel } from '../../models/QuestionState.js';
import { TeamModel, type TimeAdjustment } from '../../models/Team.js';
import { RewindStepInvalidError, TeamNotFoundError } from '../../utils/errors/index.js';
import { readAdminTeamDetail } from './readAdminTeamDetail.js';

const AUTOMATIC_TYPES = new Set<TimeAdjustmentType>([
  TimeAdjustmentType.WRONG_ANSWER,
  TimeAdjustmentType.HINT,
]);

/** Стирает прохождение шага-вопроса и всё после него; команда снова ждёт код. */
export async function rewindTeam(teamId: string, stepIndex: number): Promise<AdminTeamDetailDto> {
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw new TeamNotFoundError();
  }
  if (team.sequence[stepIndex]?.kind !== StepKind.QUESTION || stepIndex > team.currentStepIndex) {
    throw new RewindStepInvalidError(stepIndex, team.currentStepIndex);
  }

  await QuestionStateModel.deleteMany({ teamId: team._id, stepIndex: { $gte: stepIndex } });
  team.timeAdjustments = team.timeAdjustments.filter(
    (adjustment) => !isRolledBack(adjustment, stepIndex),
  );
  // Шаг-вопрос без состояния ввод кода не принимает
  team.currentStepIndex = stepIndex - 1;
  await team.save();

  return readAdminTeamDetail(team);
}

/** Автоматические поправки откатываемых шагов уходят вместе с ними; ручные остаются. */
function isRolledBack(adjustment: TimeAdjustment, fromStepIndex: number): boolean {
  if (!AUTOMATIC_TYPES.has(adjustment.type)) {
    return false;
  }
  return adjustment.stepIndex !== null && adjustment.stepIndex >= fromStepIndex;
}
