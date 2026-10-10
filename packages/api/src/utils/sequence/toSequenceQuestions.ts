import { toRoomKey } from '@quest/shared';
import { type Question } from '../../models/questionFields.js';
import { type SequenceQuestion, type SequenceQuestionLookup } from './types.js';

/** Всё, что нужно валидатору маршрута: вопросы аудитории и их ответы, по аудитории. */
export function toSequenceQuestions(questions: Question[]): SequenceQuestionLookup {
  const byRoom = new Map<string, SequenceQuestion[]>();

  for (const question of questions) {
    for (const room of question.rooms) {
      const sequenceQuestion = {
        location: room.location,
        roomNumber: room.roomNumber,
        nextRoomAnswers: question.answerIsNextRoom
          ? question.acceptedAnswers.map((answer) => answer.html)
          : [],
        hasDynamicAnswer: question.hasDynamicAnswer,
        teamSlugs: question.teamSlugs ?? [],
      };
      byRoom.set(toRoomKey(room), [...(byRoom.get(toRoomKey(room)) ?? []), sequenceQuestion]);
    }
  }
  return byRoom;
}
