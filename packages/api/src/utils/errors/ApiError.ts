import { type ApiErrorCode, type ApiErrorDto, type ApiErrorInfo } from '@quest/shared';
import httpStatus from 'http-status';

export type ErrorData = Record<string, unknown>;

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  /** Уходит клиенту в поле `data`. Только безопасные значения. */
  readonly data: ErrorData | undefined;
  /** Только для логов, наружу не отдаётся. */
  readonly logData: ErrorData | undefined;

  constructor(status: number, info: ApiErrorInfo, data?: ErrorData, logData?: ErrorData) {
    super(info.message);
    this.name = new.target.name;
    this.status = status;
    this.code = info.code as ApiErrorCode;
    this.data = data;
    this.logData = logData;
  }

  toApiErrorDto(): ApiErrorDto {
    if (this.data === undefined) {
      return { code: this.code, message: this.message };
    }
    return { code: this.code, message: this.message, data: this.data };
  }
}

/** Ошибка сервера: контекст уходит в лог, клиент видит код и общее сообщение. */
export class InternalApiError extends ApiError {
  constructor(info: ApiErrorInfo, logData?: ErrorData) {
    super(httpStatus.INTERNAL_SERVER_ERROR, info, undefined, logData);
  }
}
