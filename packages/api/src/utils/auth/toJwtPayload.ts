import { type TeamDocument } from '../../models/Team.js';
import { SessionMissingError } from '../errors/index.js';
import { type JwtPayload } from './types.js';

export function toJwtPayload(team: TeamDocument): JwtPayload {
  if (team.sessionId === null) {
    throw new SessionMissingError(team.id);
  }
  return { sub: team.id, sid: team.sessionId };
}
