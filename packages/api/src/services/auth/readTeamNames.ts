import { TeamModel } from '../../models/Team.js';

/** Названия всех команд по алфавиту: из них команда выбирает себя на входе. */
export async function readTeamNames(): Promise<string[]> {
  const teams = await TeamModel.find().select('name').sort({ name: 1 }).lean();
  return teams.map((team) => team.name);
}
