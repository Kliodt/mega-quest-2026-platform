import { type AdminCreateTeamRequestDto, type AdminTeamDetailDto } from '@quest/shared';
import { TeamModel } from '../../models/Team.js';
import { hashPassword } from '../../utils/auth/hashPassword.js';
import { RouteInvalidError, TeamNameTakenError } from '../../utils/errors/index.js';
import { validateSequence } from '../../utils/sequence/validateSequence.js';
import { readSequenceQuestions } from '../question/readSequenceQuestions.js';
import { readAdminTeamDetail } from './readAdminTeamDetail.js';

export async function createTeam(body: AdminCreateTeamRequestDto): Promise<AdminTeamDetailDto> {
  // Команду завели руками, значит вариантов вопросов на неё нет: slug выдаём случайный
  const teams = await TeamModel.find().select('slug').lean();
  const slug = toFreeSlug(new Set(teams.map((team) => team.slug)));
  const validation = validateSequence(body.sequence, await readSequenceQuestions(), slug);
  if (!validation.ok) {
    throw new RouteInvalidError(validation.errors);
  }
  if (await TeamModel.exists({ name: body.name })) {
    throw new TeamNameTakenError();
  }
  const team = await TeamModel.create({
    slug,
    name: body.name,
    passwordHash: await hashPassword(body.password),
    sessionId: null,
    sequence: body.sequence,
    currentStepIndex: 0,
  });
  return readAdminTeamDetail(team);
}

const SLUG_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const SLUG_LENGTH = 5;

/** Такой же формы, как slug из таблицы организаторов: `team_abcde`. */
function toRandomSlug(length: number): string {
  const letters = Array.from(
    { length },
    () => SLUG_ALPHABET[Math.floor(Math.random() * SLUG_ALPHABET.length)],
  );
  return `team_${letters.join('')}`;
}

/**
 * Свободное имя: совпадение почти невероятно, но на `slug` стоит unique-индекс, и
 * попасть в занятое значило бы ошибку сервера вместо созданной команды. Занятое имя
 * берём длиннее — так перебор всегда заканчивается.
 */
function toFreeSlug(taken: ReadonlySet<string>): string {
  let slug = toRandomSlug(SLUG_LENGTH);
  for (let length = SLUG_LENGTH + 1; taken.has(slug); length += 1) {
    slug = toRandomSlug(length);
  }
  return slug;
}
