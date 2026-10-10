import {
  TeamStatus,
  type AdminTeamDetailDto,
  type AdminUpdateTeamRequestDto,
  type TeamStep,
} from '@quest/shared';
import { TeamModel, type TeamDocument } from '../../models/Team.js';
import { hashPassword } from '../../utils/auth/hashPassword.js';
import {
  RouteInvalidError,
  RoutePrefixLockedError,
  TeamNameTakenError,
  TeamNotFoundError,
} from '../../utils/errors/index.js';
import { validateSequence } from '../../utils/sequence/validateSequence.js';
import { getTeamStatus } from '../../utils/team/getTeamStatus.js';
import { readSequenceQuestions } from '../question/readSequenceQuestions.js';
import { readAdminTeamDetail } from './readAdminTeamDetail.js';

export async function updateTeam(
  teamId: string,
  body: AdminUpdateTeamRequestDto,
): Promise<AdminTeamDetailDto> {
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw new TeamNotFoundError();
  }

  if (body.name !== undefined && body.name !== team.name) {
    if (await TeamModel.exists({ name: body.name, _id: { $ne: team._id } })) {
      throw new TeamNameTakenError();
    }
    team.name = body.name;
  }
  if (body.password !== undefined) {
    team.passwordHash = await hashPassword(body.password);
    team.sessionId = null;
  }
  if (body.sequence !== undefined) {
    await applySequence(team, body.sequence);
  }

  await team.save();
  return readAdminTeamDetail(team);
}

/** Пройденная часть маршрута заморожена: состояния вопросов привязаны к индексам шагов. */
async function applySequence(team: TeamDocument, sequence: TeamStep[]): Promise<void> {
  const validation = validateSequence(sequence, await readSequenceQuestions(), team.slug);
  if (!validation.ok) {
    throw new RouteInvalidError(validation.errors);
  }
  if (getTeamStatus(team) !== TeamStatus.NOT_STARTED) {
    const lockedThroughIndex = Math.min(team.currentStepIndex, team.sequence.length - 1);
    for (let index = 0; index <= lockedThroughIndex; index += 1) {
      if (JSON.stringify(sequence[index]) !== JSON.stringify(team.sequence[index])) {
        throw new RoutePrefixLockedError(lockedThroughIndex);
      }
    }
  }
  team.sequence = sequence;
  team.markModified('sequence');
}
