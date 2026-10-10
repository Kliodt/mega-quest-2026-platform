import { QuestErrors, toRoomKey, type RoomRef } from '@quest/shared';
import httpStatus from 'http-status';
import { ApiError, InternalApiError } from './ApiError.js';

export class WrongCodeError extends ApiError {
  constructor() {
    super(httpStatus.BAD_REQUEST, QuestErrors.wrongCode);
  }
}

export class QuestionAlreadyOpenError extends ApiError {
  constructor() {
    super(httpStatus.CONFLICT, QuestErrors.questionAlreadyOpen);
  }
}

export class NoOpenQuestionError extends ApiError {
  constructor() {
    super(httpStatus.CONFLICT, QuestErrors.noOpenQuestion);
  }
}

export class QuestFinishedError extends ApiError {
  constructor() {
    super(httpStatus.CONFLICT, QuestErrors.finished);
  }
}

export class HintOrderViolationError extends ApiError {
  constructor(nextHintIndex: number) {
    super(httpStatus.CONFLICT, QuestErrors.hintOrderViolation, { nextHintIndex });
  }
}

export class HintsExhaustedError extends ApiError {
  constructor() {
    super(httpStatus.CONFLICT, QuestErrors.hintsExhausted);
  }
}

/** Отсканировали код, который не привязан ни к одной клетке поля. */
export class UnknownCellCodeError extends ApiError {
  constructor() {
    super(httpStatus.NOT_FOUND, QuestErrors.unknownCellCode);
  }
}

/** Сигнал пришёл от механизма, которого нет ни у одного вопроса. */
export class UnknownExternalCodeError extends ApiError {
  constructor(externalAnswerCode: number) {
    super(httpStatus.NOT_FOUND, QuestErrors.unknownExternalCode, { externalAnswerCode });
  }
}

/** Механизм сработал, но вопрос в его аудитории сейчас никем не открыт. */
export class NoWaitingTeamError extends ApiError {
  constructor(externalAnswerCode: number) {
    super(httpStatus.CONFLICT, QuestErrors.noWaitingTeam, { externalAnswerCode });
  }
}

/** Ответ вычисляется по маршруту, но следующей аудитории в нём нет: маршрут невалиден. */
export class DynamicAnswerMissingError extends InternalApiError {
  constructor(rooms: RoomRef[], stepIndex: number) {
    super(QuestErrors.dynamicAnswerMissing, { rooms: rooms.map(toRoomKey), stepIndex });
  }
}

export class HintMissingError extends InternalApiError {
  constructor(hintIndex: number) {
    super(QuestErrors.hintMissing, { hintIndex });
  }
}
