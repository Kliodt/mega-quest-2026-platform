import { CommonErrors } from '@quest/shared';
import httpStatus from 'http-status';
import { ApiError, InternalApiError, type ErrorData } from './ApiError.js';

export class InternalError extends InternalApiError {
  constructor(logData?: ErrorData) {
    super(CommonErrors.internal, logData);
  }
}

export class NotFoundError extends ApiError {
  constructor() {
    super(httpStatus.NOT_FOUND, CommonErrors.notFound);
  }
}

/** Наш валидатор отверг запрос. Его текст безопасен и полезен, поэтому уходит в `data`. */
export class ValidationError extends ApiError {
  constructor(validation?: string) {
    super(
      httpStatus.BAD_REQUEST,
      CommonErrors.validation,
      validation === undefined ? undefined : { validation },
    );
  }
}

/** Запрос отверг фреймворк: статус сохраняем, чужой текст уходит только в лог. */
export class RequestRejectedError extends ApiError {
  constructor(status: number, logData?: ErrorData) {
    super(status, CommonErrors.requestRejected, undefined, logData);
  }
}
