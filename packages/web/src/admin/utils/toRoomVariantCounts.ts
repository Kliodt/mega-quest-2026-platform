import { toRoomKey, type AdminQuestionDto } from '@quest/shared';

/** Сколько вопросов стоит в каждой аудитории: столько вариантов и может выпасть команде. */
export function toRoomVariantCounts(questions: AdminQuestionDto[]): Map<string, number> {
  const counts = new Map<string, number>();
  questions.forEach((question) => {
    question.rooms.forEach((room) => {
      const key = toRoomKey(room);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
  });
  return counts;
}
