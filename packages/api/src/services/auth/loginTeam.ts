import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { TeamModel, type TeamDocument } from '../../models/Team.js';
import { InvalidCredentialsError } from '../../utils/errors/index.js';

export async function loginTeam(name: string, password: string): Promise<TeamDocument> {
  const team = await TeamModel.findOne({ name });
  if (!team) {
    throw new InvalidCredentialsError();
  }
  const passwordMatches = await bcrypt.compare(password, team.passwordHash);
  if (!passwordMatches) {
    throw new InvalidCredentialsError();
  }
  team.sessionId = randomUUID();
  await team.save();
  return team;
}
