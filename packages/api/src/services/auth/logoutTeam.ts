import { type TeamDocument } from '../../models/Team.js';

export async function logoutTeam(team: TeamDocument): Promise<void> {
  team.sessionId = null;
  await team.save();
}
