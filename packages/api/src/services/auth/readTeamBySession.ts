import { TeamModel, type TeamDocument } from '../../models/Team.js';
import { type JwtPayload } from '../../utils/auth/types.js';
import { SessionReplacedError, UnauthorizedError } from '../../utils/errors/index.js';

/** Команда по токену; у неё одна активная сессия, поэтому чужая выбивается. */
export async function readTeamBySession(payload: JwtPayload): Promise<TeamDocument> {
  const team = await TeamModel.findById(payload.sub);
  if (!team) {
    throw new UnauthorizedError();
  }
  if (team.sessionId !== payload.sid) {
    throw new SessionReplacedError();
  }
  return team;
}
