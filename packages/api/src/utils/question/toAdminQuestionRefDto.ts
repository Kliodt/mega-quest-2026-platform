import { type AdminQuestionRefDto, type RoomRef } from '@quest/shared';
import { type ProgressQuestionInput } from '../progress/types.js';

/** Аудитория маршрута и механика вопроса, который в ней стоит. */
export function toAdminQuestionRefDto(
  room: RoomRef,
  question: ProgressQuestionInput,
): AdminQuestionRefDto {
  return {
    location: room.location,
    roomNumber: room.roomNumber,
    gameType: question.gameType,
  };
}
