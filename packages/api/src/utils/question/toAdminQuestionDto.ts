import { type AdminQuestionDto } from '@quest/shared';
import { type Question } from '../../models/questionFields.js';

/**
 * Вопрос для организатора: общая часть от core, `content` с ответами — от типа игры.
 * Команды вариант помнит по `slug`, а организатору показываем их имена.
 */
export function toAdminQuestionDto(
  question: Question,
  content: unknown,
  teamNamesBySlug: ReadonlyMap<string, string>,
): AdminQuestionDto {
  return {
    rooms: question.rooms.map(({ location, roomNumber }) => ({ location, roomNumber })),
    gameType: question.gameType,
    answerIsNextRoom: question.answerIsNextRoom,
    hasDynamicAnswer: question.hasDynamicAnswer,
    waitsForExternalAnswer: question.waitsForExternalAnswer,
    teamNames: (question.teamSlugs ?? []).map((slug) => teamNamesBySlug.get(slug) ?? slug),
    content,
  };
}
