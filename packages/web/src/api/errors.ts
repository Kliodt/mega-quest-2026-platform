import { type ApiErrorCode, type ApiErrorDto } from '@quest/shared';

export type ApiErrorData = ApiErrorDto['data'];

/** Тело ошибки без `data`: в константах под этим ключом лежит схема, а не значение. */
export interface ErrorBody {
  code: string;
  message: string;
}

/** Запрос не дошёл до сервера, поэтому HTTP-статуса у него нет. */
export const NO_HTTP_STATUS = 0;

/** Ошибка запроса к API: категорию даёт `status`, причину — `code`. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly data: ApiErrorData;

  constructor(status: number, body: ErrorBody, data?: ApiErrorData) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code as ApiErrorCode;
    this.data = data;
  }
}
