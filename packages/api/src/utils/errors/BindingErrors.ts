import { BindingErrors } from '@quest/shared';
import httpStatus from 'http-status';
import { ApiError } from './ApiError.js';

export class BindingNotFoundError extends ApiError {
  constructor(code: string) {
    super(httpStatus.NOT_FOUND, BindingErrors.notFound, { code });
  }
}


/** «107 (Б14)» — номер с пометкой, «(Б14)» — уже ничего: платформе нужен номер. */
export class BindingRoomInvalidError extends ApiError {
  constructor(room: string) {
    super(httpStatus.BAD_REQUEST, BindingErrors.roomInvalid, { room });
  }
}
