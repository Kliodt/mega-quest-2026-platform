import { CellErrors, toRoomKey, type RoomRef } from '@quest/shared';
import httpStatus from 'http-status';
import { ApiError } from './ApiError.js';

/** У клетки один код: иначе неясно, какой из них команда должна отсканировать. */
export class CellTakenError extends ApiError {
  constructor(cell: { row: number; col: number }, code: string) {
    super(httpStatus.CONFLICT, CellErrors.taken, { cell: `${cell.col + 1}-${cell.row + 1}`, code });
  }
}

/** Клетки принадлежат вопросу, поэтому код вешается на аудиторию, где вопрос стоит. */
export class CellQuestionNotFoundError extends ApiError {
  constructor(room: RoomRef) {
    super(httpStatus.NOT_FOUND, CellErrors.questionNotFound, { room: toRoomKey(room) });
  }
}
