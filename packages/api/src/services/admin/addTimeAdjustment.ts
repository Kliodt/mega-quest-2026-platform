import {
  StepKind,
  type AdminAddTimeAdjustmentRequestDto,
  type AdminTeamDetailDto,
} from '@quest/shared';
import { TeamModel, type TeamDocument } from '../../models/Team.js';
import { TeamNotFoundError, TimeAdjustmentStepInvalidError } from '../../utils/errors/index.js';
import { recordTimeAdjustment } from '../quest/recordTimeAdjustment.js';
import { readAdminTeamDetail } from './readAdminTeamDetail.js';

/** Ручная поправка времени организатора: знак задаёт направление, тип — причину. */
export async function addTimeAdjustment(
  teamId: string,
  body: AdminAddTimeAdjustmentRequestDto,
  now = new Date(),
): Promise<AdminTeamDetailDto> {
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw new TeamNotFoundError();
  }
  const stepIndex = readStepIndex(team, body.stepIndex);
  const updated = await recordTimeAdjustment(
    team,
    {
      timeAdjustmentSeconds: body.timeAdjustmentSeconds,
      type: body.type,
      comment: body.comment,
      stepIndex,
    },
    now,
  );
  return readAdminTeamDetail(updated, now);
}

/** Только шаг-вопрос этой команды: иначе поправка войдёт в таймер, но не в карточки шагов. */
function readStepIndex(team: TeamDocument, stepIndex: number | undefined): number | null {
  if (stepIndex === undefined) {
    return null;
  }
  if (team.sequence[stepIndex]?.kind !== StepKind.QUESTION) {
    throw new TimeAdjustmentStepInvalidError(stepIndex);
  }
  return stepIndex;
}
