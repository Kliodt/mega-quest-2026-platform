import { type AdminTeamDetailDto } from '@quest/shared';
import { type FastifyBaseLogger } from 'fastify';
import { TeamModel } from '../../models/Team.js';
import { TeamNotFoundError } from '../../utils/errors/index.js';
import { enterCode } from '../quest/enterCode.js';
import { getAdminTeamDetail } from './getAdminTeamDetail.js';

/** Своего кода у организатора нет, поэтому идём тем же путём, что и тестовый код. */
const ADMIN_SCAN_CODE = 'ответ организатора';

/**
 * Организатор сканирует код за команду: QR не читается, телефон не даёт камеру, дверь
 * заперта. Дальше всё как при настоящем скане — открывается вопрос первой аудитории шага,
 * а на финишном переходе закрывается квест.
 */
export async function scanForTeam(
  teamId: string,
  log: FastifyBaseLogger,
  now = new Date(),
): Promise<AdminTeamDetailDto> {
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw new TeamNotFoundError();
  }
  await enterCode(team, ADMIN_SCAN_CODE, log, now, ADMIN_SCAN_CODE);
  return getAdminTeamDetail(teamId, now);
}
