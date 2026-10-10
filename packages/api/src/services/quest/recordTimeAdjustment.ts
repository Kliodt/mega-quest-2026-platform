import { TeamModel, type TeamDocument } from '../../models/Team.js';
import { TeamNotFoundError } from '../../utils/errors/index.js';
import { type TimeAdjustmentInput } from './types.js';

/** Добавляет поправку времени команде; нулевая не записывается. */
export async function recordTimeAdjustment(
  team: TeamDocument,
  input: TimeAdjustmentInput,
  now = new Date(),
): Promise<TeamDocument> {
  if (input.timeAdjustmentSeconds === 0) {
    return team;
  }
  const updated = await TeamModel.findOneAndUpdate(
    { _id: team._id },
    { $push: { timeAdjustments: { ...input, createdAt: now } } },
    { returnDocument: 'after' },
  );
  if (!updated) {
    throw new TeamNotFoundError();
  }
  return updated;
}
