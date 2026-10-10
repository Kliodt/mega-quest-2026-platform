import { toRoomKey, type RoomRef } from '@quest/shared';
import { QuestionModel, type QuestionDocument } from '../../models/Question.js';

/**
 * Вопросы указанных аудиторий, одним запросом. В аудитории их бывает несколько (их выдают
 * по очереди), а один вопрос стоит в нескольких аудиториях — поэтому он лежит под каждой своей.
 */
export async function readQuestionsByRooms(
  rooms: RoomRef[],
): Promise<Map<string, QuestionDocument[]>> {
  if (rooms.length === 0) {
    return new Map();
  }
  const questions = await QuestionModel.find({
    $or: rooms.map(({ location, roomNumber }) => ({
      rooms: { $elemMatch: { location, roomNumber } },
    })),
  });

  const byRoom = new Map<string, QuestionDocument[]>();
  for (const question of questions) {
    for (const room of question.rooms) {
      byRoom.set(toRoomKey(room), [...(byRoom.get(toRoomKey(room)) ?? []), question]);
    }
  }
  return byRoom;
}
