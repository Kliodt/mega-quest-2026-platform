import { type RatingDto } from '@quest/shared';
import { toRatingDto } from '../../utils/rating/toRatingDto.js';
import { readRatingTeams } from './readRatingTeams.js';

export async function getRating(now = new Date()): Promise<RatingDto> {
  return toRatingDto(await readRatingTeams(), now);
}
